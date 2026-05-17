import { worldMaps } from "./maps.js";

const TRACKS = {
  meadow: {
    src: "assets/audio/maps/meadow.ogg",
    volume: 0.32
  },
  emberCave: {
    src: "assets/audio/maps/ember-cave.ogg",
    volume: 0.46
  },
  battle: {
    src: "assets/audio/scenes/battle.ogg",
    volume: 0.1
  }
};

const SCENE_TRACKS = {
  battle: "battle"
};

const MAP_MUSIC_SCENES = new Set(["world", "menu", "campMenu", "encounter"]);

const SOUND_EFFECTS = {
  encounter: {
    src: "assets/audio/effects/encounter.ogg",
    volume: 0.7
  }
};

export function createAudioController({ gameState }) {
  const trackRecords = new Map();
  const soundEffectRecords = new Map();
  let currentTrackKey = null;
  let audioUnlocked = false;
  let playBlocked = false;
  let playPromise = null;

  function currentMapAudioTrack() {
    return worldMaps[gameState.world.currentMapId]?.audio?.track ?? null;
  }

  function desiredTrackKey() {
    const sceneTrackKey = SCENE_TRACKS[gameState.scene];
    if (sceneTrackKey) return sceneTrackKey;
    if (!MAP_MUSIC_SCENES.has(gameState.scene)) return null;
    return currentMapAudioTrack();
  }

  function trackForKey(trackKey) {
    return TRACKS[trackKey] ?? null;
  }

  function ensureTrack(trackKey) {
    if (trackRecords.has(trackKey)) return trackRecords.get(trackKey);

    const track = trackForKey(trackKey);
    if (!track) return null;

    const audio = new Audio(track.src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = track.volume;

    const record = { audio, track };
    trackRecords.set(trackKey, record);
    return record;
  }

  function ensureSoundEffect(name) {
    if (soundEffectRecords.has(name)) return soundEffectRecords.get(name);

    const soundEffect = SOUND_EFFECTS[name];
    if (!soundEffect) return null;

    const audio = new Audio(soundEffect.src);
    audio.preload = "auto";
    audio.volume = soundEffect.volume;

    const record = { audio, soundEffect };
    soundEffectRecords.set(name, record);
    return record;
  }

  function pauseTrack(trackKey) {
    const record = trackRecords.get(trackKey);
    if (!record) return;
    record.audio.pause();
  }

  function unlockAudio() {
    audioUnlocked = true;
    playBlocked = false;
  }

  function sync() {
    const nextTrackKey = desiredTrackKey();

    if (currentTrackKey !== nextTrackKey) {
      if (currentTrackKey) {
        pauseTrack(currentTrackKey);
      }
      currentTrackKey = nextTrackKey;
    }

    if (!currentTrackKey || !audioUnlocked || playBlocked || playPromise) {
      return;
    }

    const record = ensureTrack(currentTrackKey);
    if (!record) return;

    const { audio } = record;
    if (!audio.paused) return;

    playPromise = audio.play()
      .catch(() => {
        playBlocked = true;
      })
      .finally(() => {
        playPromise = null;
      });
  }

  function playSoundEffect(name) {
    if (!audioUnlocked) return;

    const record = ensureSoundEffect(name);
    if (!record) return;

    const audio = record.audio.cloneNode();
    audio.volume = record.soundEffect.volume;
    audio.play().catch(() => {});
  }

  return {
    playSoundEffect,
    sync,
    unlockAudio
  };
}
