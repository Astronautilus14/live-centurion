import { useState } from "react";
import horn from "../../assets/horn.png";
import "./Audiance.css";
import { DEFAULT_VIDEO_ID } from "../../constants";

function Audiance() {
  const [count, setCount] = useState(
    Number(localStorage.getItem("count") ?? 0),
  );
  const [toeter, setToeter] = useState(false);

  const bcToeter = new BroadcastChannel("toeter");

  bcToeter.onmessage = (event) => {
    setCount(event.data);

    if (event.data === 0) return;

    setToeter(true);
    setTimeout(() => {
      setToeter(false);
    }, 2000);
  };

  const [videoID, setVideoID] = useState(
    localStorage.getItem("video-id") ?? DEFAULT_VIDEO_ID,
  );

  const bcVideo = new BroadcastChannel("video");

  bcVideo.onmessage = (event) => {
    setVideoID(event.data);
  };

  return (
    <>
      <div className={`horns ${toeter ? "slideup" : ""}`}>
        <img
          src={horn}
          alt="airhorn"
          className={`mirror ${toeter ? "wiggle" : ""}`}
        />
        <img src={horn} alt="airhorn" className={`${toeter ? "wiggle" : ""}`} />
      </div>
      <div className={`audiance ${toeter ? "bounce" : ""}`}>
        <h1>{count}</h1>
      </div>
      <div className="background">
        <iframe
          src={`https://www.youtube.com/embed/${videoID}?autoplay=1&mute=1&controls=0&loop=1&color=black&playsinline=1`}
          title="YouTube video player"
          allow="autoplay"
        />
      </div>
    </>
  );
}

export default Audiance;
