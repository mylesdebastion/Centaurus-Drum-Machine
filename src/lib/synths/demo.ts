/**
 * demo.ts
 * 
 * Quick demo/test for the new audio engine
 * Run this in browser console after importing:
 * 
 * import { runAudioDemo } from './src/lib/synths/demo';
 * runAudioDemo();
 */

import { audioEngine, MelodyPreset, BassPreset, ChordPreset, DrumType } from '../audioEngine';

export async function runAudioDemo() {
  console.log('🎵 Audio Engine Demo Starting...');

  // Initialize audio engine (requires user gesture)
  await audioEngine.init();
  console.log('✅ Audio engine initialized');

  // Helper to wait
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Demo 1: Melody Presets
  console.log('\n🎹 Demo 1: Melody Presets (6 total)');
  const melodyPresets = [
    { preset: MelodyPreset.GlissLead, name: 'Gliss Lead' },
    { preset: MelodyPreset.Bell, name: 'Bell' },
    { preset: MelodyPreset.Flute, name: 'Flute' },
    { preset: MelodyPreset.SquareLead, name: 'Square Lead' },
    { preset: MelodyPreset.PWM, name: 'PWM' },
    { preset: MelodyPreset.SyncLead, name: 'Sync Lead' },
  ];

  for (const { preset, name } of melodyPresets) {
    console.log(`  Playing: ${name}`);
    audioEngine.setMelodyPreset(preset);
    
    // Play a C major arpeggio
    audioEngine.triggerNote(60, 100, 0); // C
    await wait(300);
    audioEngine.releaseNote(60, 0);
    
    audioEngine.triggerNote(64, 100, 0); // E
    await wait(300);
    audioEngine.releaseNote(64, 0);
    
    audioEngine.triggerNote(67, 100, 0); // G
    await wait(300);
    audioEngine.releaseNote(67, 0);
    
    audioEngine.triggerNote(72, 100, 0); // C high
    await wait(500);
    audioEngine.releaseNote(72, 0);
    
    await wait(200);
  }

  // Demo 2: Chord Presets (NEW - includes Rhodes!)
  console.log('\n🎹 Demo 2: Chord Presets (6 total, including Rhodes EP)');
  const chordPresets = [
    { preset: ChordPreset.Pad, name: 'Pad' },
    { preset: ChordPreset.Piano, name: 'Piano' },
    { preset: ChordPreset.RhodesEP, name: 'Rhodes EP' },  // ⭐ NEW
    { preset: ChordPreset.Wurlitzer, name: 'Wurlitzer' },
    { preset: ChordPreset.Pluck, name: 'Pluck' },
    { preset: ChordPreset.Organ, name: 'Organ' },
  ];

  for (const { preset, name } of chordPresets) {
    console.log(`  Playing: ${name}`);
    audioEngine.setChordPreset(preset);
    
    // Play a C major chord on chords track (track 1)
    audioEngine.triggerNote(60, 100, 1); // C
    audioEngine.triggerNote(64, 100, 1); // E
    audioEngine.triggerNote(67, 100, 1); // G
    await wait(800);
    audioEngine.releaseNote(60, 1);
    audioEngine.releaseNote(64, 1);
    audioEngine.releaseNote(67, 1);
    
    await wait(300);
  }

  // Demo 3: Bass Presets
  console.log('\n🔊 Demo 3: Bass Presets (4 total)');
  const bassPresets = [
    { preset: BassPreset.AcidBass, name: 'Acid Bass' },
    { preset: BassPreset.FMBass, name: 'FM Bass' },
    { preset: BassPreset.SawBass, name: 'Saw Bass' },
    { preset: BassPreset.SubBass, name: 'Sub Bass' },
  ];

  for (const { preset, name } of bassPresets) {
    console.log(`  Playing: ${name}`);
    audioEngine.setBassPreset(preset);
    
    // Play bass line
    audioEngine.triggerNote(36, 120, 2); // C low
    await wait(400);
    audioEngine.releaseNote(36, 2);
    
    audioEngine.triggerNote(43, 100, 2); // G low
    await wait(400);
    audioEngine.releaseNote(43, 2);
    
    await wait(200);
  }

  // Demo 4: Acid Bass Velocity Sweep
  console.log('\n🎛️  Demo 4: Acid Bass Filter Sweep (velocity-controlled)');
  audioEngine.setBassPreset(BassPreset.AcidBass);
  
  for (let vel = 40; vel <= 120; vel += 20) {
    console.log(`  Velocity: ${vel} (filter cutoff: ${400 + (vel / 127) * 1500}Hz)`);
    audioEngine.triggerNote(36, vel, 2);
    await wait(250);
    audioEngine.releaseNote(36, 2);
    await wait(50);
  }

  // Demo 5: Drums
  console.log('\n🥁 Demo 5: Drum Pattern');
  const pattern = [
    { drum: DrumType.Kick, name: 'Kick', beats: [0, 4, 8, 12] },
    { drum: DrumType.Snare, name: 'Snare', beats: [4, 12] },
    { drum: DrumType.ClosedHat, name: 'Hihat', beats: [0, 2, 4, 6, 8, 10, 12, 14] },
  ];

  for (let i = 0; i < 16; i++) {
    for (const { drum, name, beats } of pattern) {
      if (beats.includes(i)) {
        console.log(`  Beat ${i}: ${name}`);
        audioEngine.triggerDrum(drum, 100);
      }
    }
    await wait(150); // 400 BPM for demo
  }

  // Demo 6: Polyphonic Chord
  console.log('\n🎼 Demo 6: Polyphonic Chord (C Major)');
  audioEngine.setMelodyPreset(MelodyPreset.Bell);
  
  // Trigger all notes simultaneously
  audioEngine.triggerNote(60, 100, 0); // C
  audioEngine.triggerNote(64, 100, 0); // E
  audioEngine.triggerNote(67, 100, 0); // G
  audioEngine.triggerNote(72, 100, 0); // C high
  
  await wait(2000);
  
  // Release all notes
  audioEngine.releaseNote(60, 0);
  audioEngine.releaseNote(64, 0);
  audioEngine.releaseNote(67, 0);
  audioEngine.releaseNote(72, 0);

  console.log('\n✨ Demo complete!');
}

// Quick test for individual features
export function testMelodyPreset(presetIndex: number) {
  audioEngine.setMelodyPreset(presetIndex);
  audioEngine.triggerNote(60, 100, 0);
  setTimeout(() => audioEngine.releaseNote(60, 0), 1000);
}

export function testBassPreset(presetIndex: number) {
  audioEngine.setBassPreset(presetIndex);
  audioEngine.triggerNote(36, 120, 2);
  setTimeout(() => audioEngine.releaseNote(36, 2), 1000);
}

export function testChordPreset(presetIndex: number) {
  audioEngine.setChordPreset(presetIndex);
  // Play a chord on track 1
  audioEngine.triggerNote(60, 100, 1); // C
  audioEngine.triggerNote(64, 100, 1); // E
  audioEngine.triggerNote(67, 100, 1); // G
  setTimeout(() => {
    audioEngine.releaseNote(60, 1);
    audioEngine.releaseNote(64, 1);
    audioEngine.releaseNote(67, 1);
  }, 1500);
}

export function testDrum(drumType: DrumType) {
  audioEngine.triggerDrum(drumType, 100);
}
