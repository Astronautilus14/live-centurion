import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import "./DJ.css";
import airhornSfx from "../../assets/airhorn.mp3";
import centurion from "../../assets/centurion.mp3";
import AudianceLink from "./AudianceLink";
import SettingsButton from "./SettingsButton";
import { DEFAULT_FLASH_TIME, TIMESTAMPS } from "../../constants";

function DJ() {
  const [count, setCount] = useState(
    Number(localStorage.getItem("count") ?? 0),
  );
  const countRef = useRef(count);
  const [cooldown, setCooldown] = useState(false);
  const [time, setTime] = useState(Number(localStorage.getItem("time") ?? 0));
  const timeRef = useRef(time);
  const [lastAirhorn, setLastAirhorn] = useState(
    Number(localStorage.getItem("lastAirhorn") ?? 0),
  );
  const [start, setStart] = useState(time > 0);
  const [paused, setPaused] = useState(
    Boolean(Number(localStorage.getItem("paused") ?? 0)) ||
      localStorage.getItem("inAutoMode") === "true",
  );

  const [inAutoMode, setInAutoMode] = useState(
    localStorage.getItem("inAutoMode") === "true",
  );

  const centurionRef = useRef(new Audio(centurion));

  const audioRef = useRef(new Audio(airhornSfx));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const seconds = ("0" + (Math.floor((time / 1000) % 60) % 60)).slice(-2);
  const minutes = Math.floor(time / 60000);
  const timeSinceLastAirhorn = time - lastAirhorn;

  const bc = useMemo(() => new BroadcastChannel("toeter"), []);

  const incrementCount = useCallback(() => {
    const next = countRef.current + 1;
    countRef.current = next;
    setCount(next);
    localStorage.setItem("count", next.toString());
    bc.postMessage(next);
  }, [bc]);

  const flashTime =
    Number(localStorage.getItem("flash") ?? DEFAULT_FLASH_TIME) * 1000;

  useEffect(() => {
    localStorage.setItem("time", time.toString());
  }, [time]);

  const airhornPressed = useCallback(() => {
    if (cooldown || paused) return;

    setCooldown(true);
    setTimeout(() => {
      setCooldown(false);
    }, 1000);

    const ctx = audioCtxRef.current;
    const buf = audioBufferRef.current;

    if (ctx && buf) {
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
    } else {
      // fallback to HTMLAudioElement
      audioRef.current.play();
    }

    incrementCount();

    localStorage.setItem("lastAirhorn", time.toString());
    localStorage.setItem("time", time.toString());
    setLastAirhorn(time);
  }, [cooldown, paused, incrementCount, time]);

  useEffect(() => {
    let interval: number | undefined = undefined;

    if (start) {
      const delta = 1000;
      interval = setInterval(() => {
        console.log("Updating time by", delta, "ms");
        if (!paused) {
          const nextT = timeRef.current + delta;
          timeRef.current = nextT;
          setTime(nextT);

          if (inAutoMode && TIMESTAMPS.includes(nextT)) {
            incrementCount();
            console.log("Updating count to", countRef.current);
            localStorage.setItem("lastAirhorn", nextT.toString());
            localStorage.setItem("time", nextT.toString());
            setLastAirhorn(nextT);
          }
        }
      }, delta);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [start, paused, inAutoMode, incrementCount]);

  useEffect(() => {
    // create AudioContext and decode the audio into a buffer for low-latency playback
    let mounted = true;
    const Ctx = window.AudioContext || window.AudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    audioCtxRef.current = ctx;

    fetch(airhornSfx)
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        if (!mounted) return;
        audioBufferRef.current = audioBuffer;
      })
      .catch(() => {
        // decoding failed; we'll fall back to the HTMLAudioElement
      });

    // also ensure the HTMLAudioElement is preloaded as a backup
    audioRef.current.preload = "auto";
    audioRef.current.load();

    centurionRef.current.currentTime = localStorage.getItem("time")
      ? Number(localStorage.getItem("time")) / 1000
      : 0;

    return () => {
      mounted = false;
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (start && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        airhornPressed();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [airhornPressed, start]);

  const startGame = () => {
    setStart(true);
    airhornPressed();
  };

  const reset = () => {
    if (!confirm("Are you sure you want to reset the game?")) return;

    setStart(false);
    timeRef.current = 0;
    setTime(0);
    countRef.current = 0;
    setCount(0);
    setLastAirhorn(0);
    setCooldown(false);
    setPaused(false);
    setInAutoMode(false);
    centurionRef.current.currentTime = 0;

    localStorage.clear();

    bc.postMessage(0);
  };

  const togglePause = () => {
    localStorage.setItem("paused", Number(!paused).toString());
    setPaused(!paused);

    if (inAutoMode) {
      if (!paused) {
        centurionRef.current.pause();
      } else {
        centurionRef.current.play();
      }
    }
  };

  const startAutoMode = () => {
    centurionRef.current.play();
    setStart(true);
    setInAutoMode(true);
    localStorage.setItem("inAutoMode", "true");
  };

  if (start) {
    return (
      <>
        <main>
          <div className="top">
            <h1>{count} / 100</h1>
            <h1>
              {minutes}:{seconds}
            </h1>
          </div>
          <div className="center">
            <button
              onClick={airhornPressed}
              disabled={cooldown || paused || inAutoMode}
              className={
                flashTime > 0 && timeSinceLastAirhorn > flashTime ? "panic" : ""
              }
            >
              TOETER!
            </button>
          </div>
          <div className="bottom">
            <h2>
              {Math.floor(timeSinceLastAirhorn / 1000)}s since last airhorn
            </h2>
          </div>
        </main>
        <div className="actions">
          <AudianceLink />
          <SettingsButton />
          <button onClick={reset}>🔄</button>
          <button onClick={togglePause}>{paused ? "▶️" : "⏸️"}</button>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="startScreen">
          <button onClick={startGame}>START</button>
        </div>
        <div className="actions">
          <AudianceLink />
          <SettingsButton />
          <button onClick={startAutoMode}> Auto-mode-start </button>
        </div>
      </>
    );
  }
}

export default DJ;
