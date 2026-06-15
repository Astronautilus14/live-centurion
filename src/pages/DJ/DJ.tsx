import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import "./DJ.css";
import airhornSfx from "../../assets/airhorn.mp3";

function DJ() {
  const [count, setCount] = useState(
    Number(localStorage.getItem("count") ?? 0),
  );
  const [cooldown, setCooldown] = useState(false);
  const [time, setTime] = useState(Number(localStorage.getItem("time") ?? 0));
  const [lastAirhorn, setLastAirhorn] = useState(
    Number(localStorage.getItem("lastAirhorn") ?? 0),
  );
  const [start, setStart] = useState(time > 0);
  const [paused, setPaused] = useState(
    Boolean(Number(localStorage.getItem("paused") ?? 0)),
  );

  const audioRef = useRef(new Audio(airhornSfx));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const seconds = ("0" + (Math.floor((time / 1000) % 60) % 60)).slice(-2);
  const minutes = Math.floor(time / 60000);
  const timeSinceLastAirhorn = time - lastAirhorn;

  const bc = useMemo(() => new BroadcastChannel("toeter"), []);

  useEffect(() => {
    localStorage.setItem("time", time.toString());
  }, [time]);

  useEffect(() => {
    let interval: number | undefined = undefined;

    if (start) {
      const delta = 1000;
      interval = setInterval(() => {
        if (!paused) setTime((t) => t + delta);
      }, delta);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [start, paused]);

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

    setCount((c) => {
      const next = c + 1;
      localStorage.setItem("count", next.toString());
      bc.postMessage(next);
      return next;
    });

    localStorage.setItem("lastAirhorn", time.toString());
    localStorage.setItem("time", time.toString());
    setLastAirhorn(time);
  }, [cooldown, paused, time, bc]);

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
    setTime(0);
    setCount(0);
    setLastAirhorn(0);
    setCooldown(false);
    setPaused(false);

    localStorage.clear();
  };

  const togglePause = () => {
    localStorage.setItem("paused", Number(!paused).toString());
    setPaused(!paused);
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
              disabled={cooldown || paused}
              className={timeSinceLastAirhorn > 90000 ? "panic" : ""}
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
          <button onClick={reset}>🔄</button>
          <button onClick={togglePause}>{paused ? "▶️" : "⏸️"}</button>
          <button>
            <Link to="/audiance" target="new">
              📺
            </Link>
          </button>
          {/* <button onClick={() => setCount((c) => c + 1)}>➕</button>
          <button onClick={() => setCount((c) => c - 1)}>➖</button> */}
        </div>
      </>
    );
  } else {
    return (
      <div className="startScreen">
        <button onClick={startGame}>START</button>
      </div>
    );
  }
}

export default DJ;
