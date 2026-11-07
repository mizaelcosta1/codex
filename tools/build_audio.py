"""Original synthesized effects, no external samples."""
from pathlib import Path
import wave,math,struct,random
root=Path(__file__).resolve().parents[1]/'assets/audio';root.mkdir(exist_ok=True)
rate=22050;random.seed(123)
def write(name,duration,fn):
 with wave.open(str(root/(name+'.wav')),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,fn(i/rate)))*21000)) for i in range(int(duration*rate))))
write('attack',.23,lambda t:random.uniform(-1,1)*.45*math.exp(-t*22)+math.sin(math.tau*(180*t-160*t*t))*.25*math.exp(-t*18))
write('hurt',.3,lambda t:math.sin(math.tau*(100*t-60*t*t))*.55*math.exp(-t*14))
write('restore',.9,lambda t:sum(math.sin(math.tau*f*t) for f in [440,550,660])*.16*math.sin(math.pi*t/.9)*math.exp(-t*2))
write('win',2,lambda t:sum(math.sin(math.tau*f*t) for f in [261.63,329.63,392,523.25])*.12*math.sin(math.pi*t/2))
write('forest',12,lambda t:.09*sum(math.sin(math.tau*f*t) for f in [55,82.5,110])+random.uniform(-.025,.025)+.04*math.sin(math.tau*(1800*t+45*math.sin(t*7)))*max(0,math.sin(math.tau*t/3))**18)
print('5 original audio files generated')
