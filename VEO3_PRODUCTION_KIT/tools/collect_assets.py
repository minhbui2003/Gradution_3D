"""Stage reviewed videos for later integration. Never edits public/ or deploys.

Every selected clip must exist, pass metadata checks and have an accepted review
matching its SHA. Transition reviews must include the actual movement window.
"""
import argparse
import json
import shutil
from check_assets import check,read_plan,safe_path,sha256

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scope',choices=['all','pilot'],default='all')
    args=parser.parse_args()
    report=check(args.scope)
    if report['status']!='ready':
        raise SystemExit('Nothing staged. Videos are missing, invalid or not visually reviewed. Run check_assets.py first.')
    plan=read_plan()
    reviews=json.loads(safe_path('04_HANDOFF/reviews.json').read_text(encoding='utf-8'))
    tasks={item['id']:item for item in plan['tasks']}
    target=safe_path('04_HANDOFF/ready-media-'+args.scope)
    # Validate all destinations before mutating any of them.
    for result in report['results']:
        destination=target/(result['id']+'.mp4')
        if destination.exists() and sha256(destination)!=result['sha256']:
            raise SystemExit('Conflicting staged file; review/remove it explicitly before retrying: '+str(destination))
    target.mkdir(parents=True,exist_ok=True)
    bundle=[]
    for result in report['results']:
        destination=target/(result['id']+'.mp4')
        if not destination.exists():shutil.copy2(safe_path(result['path']),destination)
        bundle.append(dict(id=result['id'],kind=result['kind'],file=destination.name,sha256=result['sha256'],
                           first_frame=tasks[result['id']]['first_frame'],last_frame=tasks[result['id']]['last_frame'],
                           actual_motion_window_seconds=reviews[result['id']].get('actual_motion_window_seconds')))
    (target/'bundle.json').write_text(json.dumps(dict(status='staged_not_integrated',scope=args.scope,assets=bundle),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Staged reviewed media: '+str(target))

if __name__=='__main__':
    main()
