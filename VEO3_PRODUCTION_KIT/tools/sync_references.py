"""Sync transition inputs after replacing a stop's canonical REFERENCE.png.

Checks all images before copying anything. Does not change existing videos.
"""
import json
import shutil
import struct
from check_assets import ROOT,read_plan,safe_path,sha256

def main():
    plan=read_plan()
    stops={item['id']:item for item in plan['stops']}
    for item in stops.values():
        path=safe_path(item['reference'])
        header=path.read_bytes()[:24]
        if header[:8]!=b'\x89PNG\r\n\x1a\n':
            raise ValueError('Reference must be a real PNG: '+item['reference'])
        width,height=struct.unpack('>II',header[16:24])
        if width<1280 or height<720 or abs(width/height-16/9)>.025:
            raise ValueError('Reference must be 16:9, at least 1280x720: '+item['reference'])
    changed=[]
    for item in stops.values():
        current=sha256(safe_path(item['reference']))
        if item.get('reference_sha256')!=current:
            changed.append(item['id'])
        item['reference_sha256']=current
    for move in plan['transitions']:
        shutil.copy2(safe_path(stops[move['source']]['reference']),safe_path(move['first_frame']))
        shutil.copy2(safe_path(stops[move['destination']]['reference']),safe_path(move['last_frame']))
    reviews_path=safe_path('04_HANDOFF/reviews.json')
    reviews=json.loads(reviews_path.read_text(encoding='utf-8'))
    invalidated=[]
    for task in plan['tasks']:
        if any(task.get(key) in changed for key in ['stop','source','destination']):
            reviews[task['id']]=dict(accepted=False,video_sha256=None,notes='Reference changed; regenerate or review against new reference.',actual_motion_window_seconds=None)
            invalidated.append(task['id'])
    safe_path('04_HANDOFF/asset-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    reviews_path.write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Synced all transition image pairs. Changed stops: '+(', '.join(changed) or 'none'))
    print('Reviews reset for: '+(', '.join(invalidated) or 'none'))
    print('STORYBOARD.jpg is a review snapshot; START_HERE.html reads the actual PNG files. Refresh the browser after changing references.')

if __name__=='__main__':
    main()
