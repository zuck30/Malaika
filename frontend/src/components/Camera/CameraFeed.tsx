import React, { useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

interface CameraFeedProps {
  isActive: boolean;
  onFrame: (image: string) => void; // Expects base64 string
  isHidden?: boolean;
  webcamRef?: React.RefObject<Webcam>;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ isActive, onFrame, isHidden = true, webcamRef: externalWebcamRef }) => {
  const internalWebcamRef = useRef<Webcam>(null);
  const webcamRef = externalWebcamRef || internalWebcamRef;

  const capture = useCallback(() => {
    // Check if webcam is active and video is actually playing/ready
    if (isActive && webcamRef.current && webcamRef.current.video?.readyState === 4) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Strip the "data:image/jpeg;base64," prefix so backend gets pure base64
        const pureBase64 = imageSrc.split(',')[1];
        onFrame(pureBase64);
      }
    }
  }, [isActive, onFrame, webcamRef]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(capture, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [capture, isActive]);

  return (
    <div className={isHidden ? "hidden" : "relative group"}>
      {isActive && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover rounded-lg"
          videoConstraints={{ facingMode: "user" }}
        />
      )}
    </div>
  );
};

export default CameraFeed;