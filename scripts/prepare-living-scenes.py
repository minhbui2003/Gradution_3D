"""Build fixed-camera forward ambience and independently sampled camera paths.

Requires numpy, opencv-python-headless, imageio-ffmpeg. Source is the extracted
Graduation_Videos.rar folder. No generated scenery or external stock is used.
"""
import argparse,json,subprocess,os
from pathlib import Path
import cv2
import numpy as np
import imageio_ffmpeg

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path('public'))
parser.add_argument('--scenes',type=int,nargs='+',default=[1,2,3,4,5])
args=parser.parse_args(); ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
W,H=1280,720; FPS=24
videos=args.output/'videos';videos.mkdir(parents=True,exist_ok=True)
manifest={'source':'Graduation_Videos.rar','fps':FPS,'camera':'Fixed reference architecture; registered positive light changes from original footage. All loops play forward.','stops':[]}

def read_frames(scene):
 cap=cv2.VideoCapture(str(args.source/f'scene-{scene:02}.mp4'))
 frames=[]
 while True:
  okay,frame=cap.read()
  if not okay: break
  frames.append(cv2.resize(frame,(W,H),interpolation=cv2.INTER_AREA))
 cap.release();return frames

def encoder(path):
 return subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(path)],stdin=subprocess.PIPE)

for scene in args.scenes:
 frames=read_frames(scene)
 if scene in (2,3):
  directory=args.output/'travel'/f'scene-{scene:02}';directory.mkdir(parents=True,exist_ok=True)
  maximum=len(frames) if scene==2 else 73
  for index,frame in enumerate(frames[:maximum]):
   cv2.imwrite(str(directory/f'frame-{index:03}.webp'),frame,[cv2.IMWRITE_WEBP_QUALITY,86])
  print(f'Camera frames scene {scene}: {maximum}',flush=True)
 if scene==1:
  # Match the last scene-01 building pose (also the scene-02 entrance pose).
  reference=frames[-1]; gray=cv2.cvtColor(cv2.resize(reference,(640,360)),cv2.COLOR_BGR2GRAY)
  yy,xx=np.mgrid[105:300:12,220:425:12].astype(np.float32)
  pts=np.stack([xx.ravel(),yy.ravel()],axis=1)
  process=encoder(videos/'scene-01-living.mp4');first=None
  for index,frame in enumerate(frames):
   current=cv2.cvtColor(cv2.resize(frame,(640,360)),cv2.COLOR_BGR2GRAY)
   flow=cv2.calcOpticalFlowFarneback(gray,current,None,.5,4,25,3,7,1.5,0)
   found=pts+flow[yy.astype(int),xx.astype(int)].reshape(-1,2)
   affine,_=cv2.estimateAffinePartial2D(pts,found,method=cv2.RANSAC,ransacReprojThreshold=2)
   if affine is not None:
    affine[:,2]*=2
    aligned=cv2.warpAffine(frame,affine,(W,H),flags=cv2.INTER_LINEAR|cv2.WARP_INVERSE_MAP,borderMode=cv2.BORDER_REFLECT)
   else: aligned=frame
   # The building remains locked; original moving clouds and light live outside it.
   lock=np.zeros((H,W),np.float32);lock[190:625,415:865]=1
   lock=cv2.GaussianBlur(lock,(0,0),18)[:,:,None]
   out=aligned.astype(np.float32)*(1-lock)+reference.astype(np.float32)*lock
   if first is None:first=out.copy()
   tail=max(0,(index-(len(frames)-19))/18)
   tail=tail*tail*(3-2*tail)
   out=out*(1-tail)+first*tail
   process.stdin.write(np.clip(out,0,255).astype(np.uint8).tobytes())
  process.stdin.close()
  if process.wait()!=0:raise RuntimeError('Hero encode failed')
  print('Fixed-camera forward hero loop',flush=True)
  continue
 if scene==2:
  stops=[('memory-1',59,True),('memory-2',85,True),('memory-3',103,True),('memory-4',115,True),('door',120,True)]
 else:stops=[(f'scene-{scene:02}-living',len(frames)-1,False)]
 for name,anchor,protect_door in stops:
  reference=frames[anchor]; small=cv2.resize(reference,(480,270)); gray=cv2.cvtColor(small,cv2.COLOR_BGR2GRAY)
  grid_y,grid_x=np.mgrid[0:270,0:480].astype(np.float32)
  lum=cv2.cvtColor(reference,cv2.COLOR_BGR2GRAY)
  edges=cv2.Canny(lum,65,130);edge_safe=1-cv2.GaussianBlur(cv2.dilate(edges,np.ones((3,3),np.uint8)),(0,0),2).astype(np.float32)/255
  if protect_door:
   # Door geometry never opens from passing ambient time.
   region=np.ones((H,W),np.float32);region[210:660,490:810]=0
   edge_safe*=cv2.GaussianBlur(region,(0,0),18)
  process=encoder(videos/(name+'.mp4'));count=60
  for index in range(count):
   # Chronological light samples; no camera or playback oscillation.
   start=max(0,min(anchor,len(frames)-count))
   sample=frames[min(len(frames)-1,start+index)]
   current=cv2.cvtColor(cv2.resize(sample,(480,270)),cv2.COLOR_BGR2GRAY)
   flow=cv2.calcOpticalFlowFarneback(gray,current,None,.5,5,31,4,7,1.5,0)
   flow=cv2.GaussianBlur(flow,(0,0),5)
   dx=cv2.resize(flow[:,:,0],(W,H))*W/480;dy=cv2.resize(flow[:,:,1],(W,H))*H/270
   full_y,full_x=np.mgrid[0:H,0:W].astype(np.float32)
   registered=cv2.remap(sample,full_x+dx,full_y+dy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
   delta=registered.astype(np.float32)-reference.astype(np.float32)
   strength=np.clip((np.max(delta,axis=2)-14)/55,0,1)
   highlight=np.clip((cv2.cvtColor(registered,cv2.COLOR_BGR2GRAY).astype(np.float32)-100)/100,0,1)
   # Keep isolated light changes, rejecting long architectural edge residuals.
   raw=strength*highlight*edge_safe
   count_labels,labels,stats,_=cv2.connectedComponentsWithStats((raw>.16).astype(np.uint8),8)
   keep=np.zeros(count_labels,np.float32)
   for label in range(1,count_labels):
    x,y,w,h,area=stats[label]
    if 2<=area<=900 and max(w,h)<=95 and max(w,h)/max(1,min(w,h))<5:
     keep[label]=1
   isolated=keep[labels]
   mask=cv2.GaussianBlur(raw*isolated,(0,0),.9)
   envelope=min(1,index/5,max(0,(count-1-index)/12));envelope=envelope*envelope*(3-2*envelope)
   out=reference.astype(np.float32)+np.maximum(delta,0)*mask[:,:,None]*envelope*.95
   process.stdin.write(np.clip(out,0,255).astype(np.uint8).tobytes())
  process.stdin.close()
  if process.wait()!=0:raise RuntimeError('Stop encode failed')
  manifest['stops'].append({'id':name,'sourceScene':scene,'anchorFrame':anchor,'anchorTime':anchor/FPS,'url':f'/videos/{name}.mp4'})
  print(f'Forward ambience {name}',flush=True)
(videos/'living-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
