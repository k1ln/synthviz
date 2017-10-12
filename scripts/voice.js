import oscillator from './oscillator.js';
import amp from './amp.js';
import makeEnvelope from './envelope.js';
import makeBiquadFilter from './biquadfilter.js';
import lfo from './lfo.js';



export function makeVoice({
  context, n, frequency, volume, type1, type2, vol1, vol2, oct1, oct2,
    cutoff1, cutoff2, res1, res2}){
  return {
    frequency,
    context,
    lfo: lfo({context, frequency: 20}),
    lfoGain: amp({context, vol: 20}),
    oscillator1: oscillator({context, n, frequency, oct: oct1, type: type1}),
    oscillator2: oscillator({context, n, frequency, oct: oct2, type: type2}),
    amp1: amp({context, vol: vol1}),
    amp2: amp({context, vol: vol2}),
    envelope1: makeEnvelope({context}),
    envelope2: makeEnvelope({context}),
    filter1: makeBiquadFilter({context, cutoff: cutoff1, res: res1}),
    filter2: makeBiquadFilter({context, cutoff: cutoff2, res: res2}),
    connect(){
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.oscillator1.oscillator.frequency);
      this.lfoGain.connect(this.oscillator2.oscillator.frequency);

      this.envelope1.connect(this.amp1.amplitude);
      this.envelope2.connect(this.amp2.amplitude);

      this.oscillator1.connect(this.amp1);
      this.oscillator2.connect(this.amp2);

      this.amp1.connect(this.filter1);
      this.amp2.connect(this.filter2);

      this.filter1.connect(volume);
      this.filter2.connect(volume);

    },

    changeFrequency(freq){
      this.oscillator1.changeFrequency(freq);
      this.oscillator2.changeFrequency(freq);
    },

    start(envelope){
      this.envelope1.envOn(envelope.attack, envelope.decay,
          envelope.sustain, this.amp1.amplitude.value);
      this.envelope2.envOn(envelope.attack, envelope.decay,
          envelope.sustain, this.amp2.amplitude.value);

      this.lfo.lfo.start();
      this.oscillator1.start();
      this.oscillator2.start();

    },
    stop(releaseTime){
      this.envelope1.envOff(releaseTime);
      this.envelope2.envOff(releaseTime);
      setTimeout(() => {
        this.oscillator1.oscillator.disconnect(this.amp1.gain);
        this.oscillator2.oscillator.disconnect(this.amp2.gain);

        this.amp1.gain.disconnect(this.filter1.filter);
        this.amp2.gain.disconnect(this.filter2.filter);

        this.filter1.filter.disconnect(volume.gain);
        this.filter2.filter.disconnect(volume.gain);
      }, releaseTime * 1000);
    }
  };
}
