"use client";

import Image from "next/image";

export default function SmokeEffect() {
  return (
    <div className="smoke-effect-container">
      <div className="smoke-wrap">
        <Image
          className="smoke smoke1"
          src="/smoke.png"
          alt="smoke"
          width={150}
          height={150}
          priority
        />
      </div>
      <div className="smoke-wrap">
        <Image
          className="smoke smoke2"
          src="/smoke.png"
          alt="smoke"
          width={150}
          height={150}
          priority
        />
      </div>
      <div className="smoke-wrap">
        <Image
          className="smoke smoke3"
          src="/smoke.png"
          alt="smoke"
          width={150}
          height={150}
          priority
        />
      </div>

      <style jsx>{`
        .smoke-effect-container {
          position: absolute;
          left: 0;
          top: 25%;
          transform: translate(-50px, -50%);
          pointer-events: none;
          width: 150px;
          height: 200px;
        }

        .smoke-wrap {
          position: absolute;
          left: 58%;
          bottom: 0;
          transform: translateX(-50%);
        }

        :global(.smoke) {
          filter: blur(5px);
          transform-origin: 50% 50%;
        }

        :global(.smoke1) {
          animation: smoke1 3s linear infinite;
          animation-delay: 0.5s;
        }

        :global(.smoke2) {
          animation: smoke2 3s linear infinite;
          animation-delay: 1.5s;
        }

        :global(.smoke3) {
          animation: smoke3 4s linear infinite;
          animation-delay: 2.5s;
        }

        @keyframes smoke1 {
          0% {
            filter: blur(0px);
            transform: translateY(0px) scale(-1, 1);
            opacity: 0;
          }
          25% {
            filter: blur(3px);
            transform: translateY(-10px) scale(-1, 1.05);
            opacity: 0.5;
          }
          50% {
            filter: blur(5px);
            transform: translateY(-20px) scale(-1, 1.1);
            opacity: 1;
          }
          75% {
            filter: blur(5px);
            transform: translateY(-30px) scale(-1, 1.15);
            opacity: 0.5;
          }
          100% {
            filter: blur(7px);
            transform: translateY(-40px) scale(-1, 1.2);
            opacity: 0;
          }
        }

        @keyframes smoke2 {
          0% {
            filter: blur(0px);
            transform: translateY(0px) scale(1);
            opacity: 0;
          }
          25% {
            filter: blur(3px);
            transform: translateY(-10px) scale(1.05);
            opacity: 0.5;
          }
          50% {
            filter: blur(5px);
            transform: translateY(-20px) scale(1.1);
            opacity: 1;
          }
          75% {
            filter: blur(5px);
            transform: translateY(-30px) scale(1.15);
            opacity: 0.5;
          }
          100% {
            filter: blur(7px);
            transform: translateY(-40px) scale(1.2);
            opacity: 0;
          }
        }

        @keyframes smoke3 {
          0% {
            filter: blur(0px);
            transform: translateY(0px) scale(1);
            opacity: 0;
          }
          25% {
            filter: blur(3px);
            transform: translateY(-20px) scale(1.05);
            opacity: 0.5;
          }
          50% {
            filter: blur(5px);
            transform: translateY(-40px) scale(1.1);
            opacity: 1;
          }
          75% {
            filter: blur(5px);
            transform: translateY(-60px) scale(1.15);
            opacity: 0.5;
          }
          100% {
            filter: blur(7px);
            transform: translateY(-80px) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
