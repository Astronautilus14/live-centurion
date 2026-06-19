import { useState } from "react";
import horn from "../../assets/horn.png";
import "./Audiance.css";

function Audiance() {
  const [count, setCount] = useState(
    Number(localStorage.getItem("count") ?? 0),
  );
  const [toeter, setToeter] = useState(false);

  const bc = new BroadcastChannel("toeter");

  bc.onmessage = (event) => {
    setCount(event.data);

    if (event.data === 0) return;

    setToeter(true);
    setTimeout(() => {
      setToeter(false);
    }, 2000);
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
          src="https://www.youtube.com/embed/UoHK74aS9sY?autoplay=1&mute=1&controls=0&loop=1&color=black&playsinline=1"
          title="YouTube video player"
          allow="autoplay"
        />
      </div>
    </>
  );
}

export default Audiance;
