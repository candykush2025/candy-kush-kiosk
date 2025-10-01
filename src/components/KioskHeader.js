"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Reusable kiosk header with optional cart & back visibility
export default function KioskHeader({
  onBack = () => {},
  onCart = () => {},
  cart = [],
  cartItemCount = 0,
  showCart = true,
  showBack = true,
  onLogoClick = null, // New optional prop for logo click handler
}) {
  const router = useRouter();

  const handleCheckout = () => {
    if (onCart && typeof onCart === "function") {
      onCart();
    } else if (cart.length > 0) {
      // Save cart to session storage
      sessionStorage.setItem("cart", JSON.stringify(cart));
      router.push("/checkout");
    }
  };

  const handleLogoClick = () => {
    if (onLogoClick && typeof onLogoClick === "function") {
      // Use custom logo click handler if provided
      onLogoClick();
    } else {
      // Default behavior: clear cart and go to home
      sessionStorage.removeItem("cart");
      sessionStorage.removeItem("customerCode");
      sessionStorage.removeItem("currentCustomer");
      sessionStorage.removeItem("selectedPaymentMethod");
      sessionStorage.removeItem("lastOrder");
      router.push("/");
    }
  };

  const getCartTotalQuantity = () => {
    if (cartItemCount > 0) return cartItemCount;
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  return (
    <div className="p-4 flex items-center justify-between">
      {showBack ? (
        <button
          onClick={onBack}
          className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center"
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      ) : (
        <div className="w-24" />
      )}
      <div className="relative">
        <style jsx>{`
          @keyframes smokeFloat1 {
            0% {
              opacity: 0.6;
              transform: translateY(0px) translateX(0px) scale(0.8) rotate(0deg);
            }
            25% {
              opacity: 0.8;
              transform: translateY(-8px) translateX(2px) scale(0.9)
                rotate(3deg);
            }
            50% {
              opacity: 0.7;
              transform: translateY(-18px) translateX(-1px) scale(1.1)
                rotate(-2deg);
            }
            75% {
              opacity: 0.4;
              transform: translateY(-30px) translateX(3px) scale(1.3)
                rotate(5deg);
            }
            100% {
              opacity: 0;
              transform: translateY(-45px) translateX(-2px) scale(1.6)
                rotate(-3deg);
            }
          }

          @keyframes smokeFloat2 {
            0% {
              opacity: 0.5;
              transform: translateY(0px) translateX(0px) scale(0.7) rotate(0deg);
            }
            20% {
              opacity: 0.9;
              transform: translateY(-5px) translateX(-2px) scale(0.85)
                rotate(-4deg);
            }
            40% {
              opacity: 0.8;
              transform: translateY(-12px) translateX(1px) scale(1) rotate(2deg);
            }
            60% {
              opacity: 0.6;
              transform: translateY(-22px) translateX(-3px) scale(1.2)
                rotate(-6deg);
            }
            80% {
              opacity: 0.3;
              transform: translateY(-35px) translateX(2px) scale(1.4)
                rotate(4deg);
            }
            100% {
              opacity: 0;
              transform: translateY(-50px) translateX(-1px) scale(1.7)
                rotate(-2deg);
            }
          }

          @keyframes smokeFloat3 {
            0% {
              opacity: 0.7;
              transform: translateY(0px) translateX(0px) scale(0.9) rotate(0deg);
            }
            30% {
              opacity: 0.85;
              transform: translateY(-10px) translateX(3px) scale(1) rotate(6deg);
            }
            60% {
              opacity: 0.5;
              transform: translateY(-25px) translateX(-2px) scale(1.25)
                rotate(-4deg);
            }
            100% {
              opacity: 0;
              transform: translateY(-42px) translateX(4px) scale(1.8)
                rotate(8deg);
            }
          }

          @keyframes smokeDrift {
            0%,
            100% {
              transform: translateX(0px);
            }
            50% {
              transform: translateX(3px);
            }
          }

          .smoke-path-1 {
            animation: smokeFloat1 6s ease-out infinite,
              smokeDrift 3s ease-in-out infinite;
            filter: blur(1px);
            opacity: 0.6;
          }

          .smoke-path-2 {
            animation: smokeFloat2 7s ease-out infinite 1.5s,
              smokeDrift 4s ease-in-out infinite 0.5s;
            filter: blur(0.8px);
            opacity: 0.5;
          }

          .smoke-path-3 {
            animation: smokeFloat3 5.5s ease-out infinite 3s,
              smokeDrift 3.5s ease-in-out infinite 1s;
            filter: blur(1.2px);
            opacity: 0.7;
          }

          .smoke-container {
            animation: smokeDrift 8s ease-in-out infinite;
          }
        `}</style>
        <svg
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          viewBox="0 0 94.62 192.14"
          enableBackground="new 0 0 94.62 192.14"
          xmlSpace="preserve"
          className="absolute w-16 h-16 top-10 -left-3 smoke-container"
        >
          <defs>
            <filter id="smokeFilter">
              <feTurbulence
                baseFrequency="0.02 0.1"
                numOctaves="3"
                result="turbulence"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="turbulence"
                scale="2"
              />
            </filter>
          </defs>
          <g id="Layer_1">
            <g>
              <g>
                <path
                  className="smoke-path-1"
                  fill="#FFFFFF"
                  filter="url(#smokeFilter)"
                  d="M75.25,176.65c-1.7,1.31-5.55-0.58-7.11-1.49c-2.12-1.23-4.1-2.93-5.51-4.95 c-2.21-3.19-3.13-7.06-4.23-10.77c-0.96-3.23-2.11-6.43-3.65-9.44c-1.56-3.06-3.88-5.45-5.64-8.34 c-0.01-0.01,2.57,0.18,2.84,0.25c0.84,0.23,1.67,0.57,2.46,0.93c1.67,0.76,3.21,1.79,4.59,2.99c2.84,2.49,5,5.75,6.29,9.29 c1.69,4.64,2.05,9.76,4.33,14.14C71.1,172.09,73.62,174.02,75.25,176.65z"
                ></path>
                <path
                  className="smoke-path-2"
                  fill="#FFFFFF"
                  filter="url(#smokeFilter)"
                  d="M32.97,140.33c-1.99,0.35-4.27-4.02-5.02-5.32c-1.46-2.52-2.58-5.24-3.17-8.1 c-0.91-4.42-0.5-9.17,1.59-13.17c2.55-4.88,7.2-8.11,10.36-12.53c1.71-2.39,2.84-5.13,3.67-7.94c0.8-2.69,0.9-5.88,1.95-8.42 c1.91,3.13,2.59,8.08,2.72,11.7c0.14,4.09-0.82,8.13-3.08,11.57c-2.25,3.41-5.59,6.05-7.58,9.62c-1.68,3.01-2.29,6.51-2.3,9.95 c-0.01,3.6,0.66,7.1,1.24,10.63C33.58,139.69,33.38,140.25,32.97,140.33z"
                ></path>
                <path
                  className="smoke-path-3"
                  fill="#FFFFFF"
                  filter="url(#smokeFilter)"
                  d="M14.35,88.29c1.35-3.51,4.36-6.23,6.51-9.25c2.23-3.14,3.32-7.08,2.97-10.92 c-0.53-5.86-4.07-10.79-6.54-15.95c-2.57-5.37-4.23-11.41-3.27-17.39c0.76-4.77,3.29-9.14,6.88-12.36 c2.57-2.3,9.11-6.09,12.57-5.63c-1.14,2.51-4.27,4.09-6.22,5.97c-3.18,3.05-5.13,7.34-5.35,11.74 c-0.54,10.93,8.97,20.17,9.53,31.09c0.27,5.17-1.65,10.21-4.75,14.29c-1.59,2.1-3.61,4.11-5.71,5.69 C19.18,86.91,16.65,88.4,14.35,88.29z"
                ></path>
              </g>
            </g>
          </g>
        </svg>
        <Image
          alt="Logo"
          width={150}
          height={150}
          src="/logo.png"
          className="cursor-pointer object-cover"
          style={{ color: "transparent" }}
          onClick={handleLogoClick}
        />
      </div>
      {showCart ? (
        <button
          onClick={handleCheckout}
          className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center"
        >
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          {(cart.length > 0 || cartItemCount > 0) && (
            <span className="absolute -top-4 -right-4 bg-red-500 text-white text-s rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {getCartTotalQuantity()}
            </span>
          )}
        </button>
      ) : (
        <div className="w-24" />
      )}
    </div>
  );
}
