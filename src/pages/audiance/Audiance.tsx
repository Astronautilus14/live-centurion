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
    setToeter(true);

    setCount(event.data);

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
      <iframe
        src="https://www.youtube.com/embed/UoHK74aS9sY?autoplay=1&mute=1"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      />
    </>
  );
}

export default Audiance;
