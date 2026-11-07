import json, subprocess, sys
LS=sys.argv[1]
lines=json.load(open('script.json'))
GAP=0.4; t=0.4; off={}
for k,txt in lines:
    subprocess.run(["python3","-m","piper","-m","piper/ar_JO-kareem-medium.onnx","-f",f"lines/{k}.wav","--length-scale",LS,"--sentence-silence","0.15"],input=txt.encode(),check=True,capture_output=True)
    subprocess.run(["ffmpeg","-v","error","-y","-i",f"lines/{k}.wav","-af","silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse","-ac","1","-ar","22050",f"trim/{k}.wav"],check=True)
    d=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"trim/{k}.wav"],capture_output=True,text=True).stdout)
    pre = 0.3 if k in ("pos0","neg0","fin1") else 0
    t+=pre; off[k]=[round(t,2),round(t+d,2)]; t+=d+GAP
json.dump(off,open('offsets.json','w'),indent=0); print(off); print('total',round(t,1))
inputs=[];filt=[]
for i,(k,_) in enumerate(lines):
    inputs+=["-i",f"trim/{k}.wav"]; filt.append(f"[{i}]adelay={int(off[k][0]*1000)}[d{i}]")
filt.append("".join(f"[d{i}]" for i in range(len(lines)))+f"amix=inputs={len(lines)}:normalize=0,apad=pad_dur=0.6,highpass=f=60,loudnorm=I=-14:TP=-1.5:LRA=8[o]")
subprocess.run(["ffmpeg","-v","error","-y",*inputs,"-filter_complex",";".join(filt),"-map","[o]","-ar","48000","-c:a","aac","-b:a","192k","/home/user/Kechoud-Mourad/public/pomme/voice-medias.m4a"],check=True)
