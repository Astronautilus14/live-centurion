import { useState, type SubmitEvent } from "react";
import Modal from "react-modal";
import "./Settings.css";
import { DEFAULT_FLASH_TIME, DEFAULT_VIDEO_ID } from "../../constants";

Modal.setAppElement("#root");

function SettingsButton() {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const bc = new BroadcastChannel("video");

  const handleFormSave = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const url: string = event.target["video-url"].value;

    if (url) {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      let videoId: string | null = null;

      if (
        hostname === "www.youtube.com" ||
        hostname === "youtube.com" ||
        hostname === "m.youtube.com"
      ) {
        videoId = parsedUrl.searchParams.get("v");
      }

      if (hostname === "youtu.be") {
        videoId = parsedUrl.pathname.slice(1);
      }

      if (videoId) {
        bc.postMessage(videoId);
        localStorage.setItem("video-id", videoId);
      }
    } else {
      bc.postMessage(DEFAULT_VIDEO_ID);
      localStorage.removeItem("video-id");
    }

    const flash = Number(event.target.flash.value);
    if (Number.isNaN(flash)) {
      localStorage.removeItem("flash");
    } else {
      localStorage.setItem("flash", flash.toString());
    }

    setModalIsOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="settings-modal"
        overlayClassName="modal-overlay"
      >
        <div className="top">
          <h2>Settings</h2>
          <button onClick={() => setModalIsOpen(false)}>X</button>
        </div>
        <form onSubmit={handleFormSave}>
          <label htmlFor="video-url">Background video URL</label>
          <input
            type="url"
            name="video-url"
            defaultValue={`https://www.youtube.com/watch?v${localStorage.getItem("video-id") ?? DEFAULT_VIDEO_ID}`}
            placeholder={`https://www.youtube.com/watch?v=${DEFAULT_VIDEO_ID}`}
          />

          <label htmlFor="flash">Flash horn button (s) 0=off</label>
          <input
            type="number"
            name="flash"
            defaultValue={localStorage.getItem("flash") ?? 90}
            placeholder={DEFAULT_FLASH_TIME.toString()}
          />

          <button>Save</button>
        </form>
      </Modal>

      <button onClick={() => setModalIsOpen(true)}>⚙️</button>
    </>
  );
}

export default SettingsButton;
