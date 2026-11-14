"""Validate returned video files without changing the website or calling an API.

Usage: python VEO3_PRODUCTION_KIT/tools/check_assets.py [--scope pilot] [--allow-missing]
Optional OpenCV provides video dimensions and endpoint checks. Visual acceptance
is always manual and tied to the exact video SHA-256.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None

ROOT = Path(__file__).resolve().parents[1]

def safe_path(value):
    path = (ROOT / value).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('Path leaves production kit: ' + str(value))
    return path

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read_plan():
    return json.loads(safe_path('04_HANDOFF/asset-plan.json').read_text(encoding='utf-8'))

def endpoint_error(frame, path):
    reference = cv2.imread(str(path))
    if reference is None or frame is None:
        return None
    a = cv2.resize(frame, (320,180)).astype(np.float32)
    b = cv2.resize(reference, (320,180)).astype(np.float32)
    return round(float(np.mean(np.abs(a-b))) / 255, 5)

def inspect_task(task, reviews):
    path = safe_path(task['output'])
    result = dict(id=task['id'], kind=task['kind'], path=task['output'], exists=path.is_file(),
                  errors=[], warnings=[], visual_accepted=False, metadata_checked=False)
    if not result['exists']:
        result['errors'].append('missing_video')
        return result
    if path.stat().st_size == 0:
        result['errors'].append('empty_video')
        return result
    result['bytes'] = path.stat().st_size
    result['sha256'] = sha256(path)
    if cv2 is None:
        result['warnings'].append('opencv_unavailable_metadata_not_checked')
    else:
        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            result['errors'].append('undecodable_video')
        else:
            width, height = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps, frames = float(cap.get(cv2.CAP_PROP_FPS)), int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frames / fps if fps > 0 else 0
            result['metadata_checked'] = True
            result['media'] = dict(width=width,height=height,fps=round(fps,4),frames=frames,duration_seconds=round(duration,4))
            if height == 0 or abs(width / height - 16/9) > .025:
                result['errors'].append('expected_landscape_16_9')
            if width < 1280 or height < 720:
                result['errors'].append('below_720p')
            if duration < 2 or duration > 20:
                result['errors'].append('unexpected_source_duration')
            elif abs(duration - 8) > .35:
                result['warnings'].append('source_is_not_requested_8_seconds_review_trim_plan')
            okay, first = cap.read()
            cap.set(cv2.CAP_PROP_POS_FRAMES, max(0,frames-1))
            last_okay, last = cap.read()
            if not okay or not last_okay:
                result['errors'].append('cannot_decode_endpoints')
            else:
                result['first_reference_mae_normalized'] = endpoint_error(first,safe_path(task['first_frame']))
                result['last_reference_mae_normalized'] = endpoint_error(last,safe_path(task['last_frame']))
                result['loop_endpoint_mae_normalized'] = round(float(np.mean(np.abs(cv2.resize(first,(320,180)).astype(float)-cv2.resize(last,(320,180)).astype(float))))/255,5)
                if max(result['first_reference_mae_normalized'] or 0,result['last_reference_mae_normalized'] or 0) > .12:
                    result['warnings'].append('endpoint_differs_from_reference_requires_visual_review')
                if task['kind']=='ambient' and result['loop_endpoint_mae_normalized'] > .06:
                    result['warnings'].append('loop_seam_requires_review')
            cap.release()
    review = reviews.get(task['id'],{})
    result['visual_accepted'] = bool(review.get('accepted') is True and review.get('video_sha256') == result['sha256'])
    if not result['visual_accepted']:
        result['warnings'].append('visual_review_pending_or_sha_changed')
    if task['kind']=='transition':
        window=review.get('actual_motion_window_seconds')
        valid_window=(isinstance(window,list) and len(window)==2 and all(isinstance(x,(int,float)) and not isinstance(x,bool) for x in window) and 0 <= window[0] < window[1] <= result.get('media',{}).get('duration_seconds',0))
        result['trim_window_reviewed']=bool(valid_window)
        if not valid_window:
            result['warnings'].append('actual_camera_motion_window_not_reviewed')
    result['technical_pass'] = result['metadata_checked'] and not result['errors']
    result['ready_for_integration'] = result['technical_pass'] and result['visual_accepted'] and (task['kind']=='ambient' or result.get('trim_window_reviewed',False))
    return result

def check(scope='all'):
    plan=read_plan()
    reviews_path=safe_path('04_HANDOFF/reviews.json')
    reviews=json.loads(reviews_path.read_text(encoding='utf-8')) if reviews_path.is_file() else {}
    tasks=[task for task in plan['tasks'] if scope=='all' or task.get('pilot')]
    results=[inspect_task(task,reviews) for task in tasks]
    stops={item['id']:item for item in plan['stops']}
    for task,result in zip(tasks,results):
        for key in ['stop','source','destination']:
            if key not in task:
                continue
            stop=stops[task[key]]
            reference=safe_path(stop['reference'])
            if not reference.is_file() or sha256(reference)!=stop['reference_sha256']:
                result['errors'].append('reference_changed_or_missing_run_sync_references')
        expected_first=stops[task.get('stop') or task.get('source')]['reference']
        expected_last=stops[task.get('stop') or task.get('destination')]['reference']
        for given,expected in [(task['first_frame'],expected_first),(task['last_frame'],expected_last)]:
            if not safe_path(given).is_file() or not safe_path(expected).is_file() or sha256(safe_path(given))!=sha256(safe_path(expected)):
                result['errors'].append('transition_reference_out_of_sync')
        if result['errors']:
            result['technical_pass']=False
            result['ready_for_integration']=False
    return dict(scope=scope, expected=len(tasks),present=sum(row['exists'] for row in results),
                ready=sum(bool(row.get('ready_for_integration')) for row in results),
                status='ready' if all(row.get('ready_for_integration') for row in results) else 'pending_assets_or_review',
                note='Pixel scores are diagnostics, not proof of camera lock, spatial continuity, or artistic quality.',results=results)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scope',choices=['all','pilot'],default='all')
    parser.add_argument('--allow-missing',action='store_true')
    args=parser.parse_args()
    report=check(args.scope)
    out=safe_path(f'04_HANDOFF/asset-check-{args.scope}.json')
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Scope: {report['scope']}; present: {report['present']}/{report['expected']}; reviewed and ready: {report['ready']}/{report['expected']}")
    print('Report: '+str(out))
    if args.allow_missing:
        hard_errors=[error for row in report['results'] for error in row['errors'] if error!='missing_video']
        return 1 if hard_errors else 0
    return 0 if report['status']=='ready' else 2

if __name__=='__main__':
    sys.exit(main())
