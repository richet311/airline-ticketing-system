// Dawn Crest: gold wings holding a shield with a runway at sunrise

const SHIELD = "M136 42 H184 V96 Q184 124 160 140 Q136 124 136 96Z";

// left wing, top feather last so it sits on top (the right wing is a mirror)
const FEATHERS = [
  { d: "M134 120 C110 111 149 90 115 95 C151 104 112 126 134 129 Z", light: false },
  { d: "M134 108 C110 99 130 79 96 84 C132 93 112 114 134 117 Z", light: true },
  { d: "M134 96 C110 87 111 68 77 73 C113 82 112 102 134 105 Z", light: false },
  { d: "M134 84 C110 75 92 57 58 62 C94 71 112 90 134 93 Z", light: true },
  { d: "M134 72 C110 63 73 46 39 51 C75 60 112 78 134 81 Z", light: false },
  { d: "M134 60 C110 51 54 35 20 40 C56 49 112 66 134 69 Z", light: true },
];

const SUN_RAYS =
  "M83.56 116.58 L70.76 114.32 M87.96 104.5 L76.7 98 M96.22 94.66 L87.86 84.7 M107.35 88.23 L102.9 76.02 " +
  "M120 86 L120 73 M132.65 88.23 L137.1 76.02 M143.78 94.66 L152.14 84.7 M152.04 104.5 L163.3 98 M156.44 116.58 L169.24 114.32";

// runway edge lights, smaller further away: [x, y, radius]
const LIGHTS = [
  [108, 128, 1.2], [132, 128, 1.2], [101.83, 144, 1.47], [138.17, 144, 1.47], [95.67, 160, 1.73], [144.33, 160, 1.73],
  [89.5, 176, 2], [150.5, 176, 2], [83.33, 192, 2.27], [156.67, 192, 2.27], [77.17, 208, 2.53], [162.83, 208, 2.53],
  [71, 224, 2.8], [169, 224, 2.8],
];

const STAR =
  "160,17 162.12,23.09 168.56,23.22 163.42,27.11 165.29,33.28 160,29.6 154.71,33.28 156.58,27.11 151.44,23.22 157.88,23.09";

function Wing() {
  return (
    <>
      {FEATHERS.map((feather) => (
        <path
          key={feather.d}
          d={feather.d}
          fill={feather.light ? "#d9b45c" : "#b38a33"}
          stroke="#0b1d3a"
          strokeWidth="1"
        />
      ))}
    </>
  );
}

// the sunrise and runway, drawn at 240x240 and scaled into the shield
function DawnScene() {
  return (
    <g transform="translate(112 43) scale(0.4)">
      <rect width="240" height="240" fill="#1553b5" />
      <rect y="66" width="240" height="30" fill="#1a66da" />
      <rect y="96" width="240" height="27" fill="#5b9cff" />
      <path d={SUN_RAYS} stroke="#e3c06e" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="123" r="30" fill="#e3c06e" />
      <rect y="122" width="240" height="120" fill="#0b1d3a" />
      <path d="M76 232 L113 123 H127 L164 232Z" fill="#24375a" />
      <path d="M76 232 L113 123 M164 232 L127 123" stroke="#ffffff" strokeWidth="2" />
      <path d="M120 130 V226" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="7 8" />
      {LIGHTS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#e3c06e" />
      ))}
    </g>
  );
}

// ribbon = the "AZURE AIR" banner under the crest; leave it off when the crest is small
export function DawnCrest({ ribbon = true, className }: { ribbon?: boolean; className?: string }) {
  return (
    <svg
      viewBox={ribbon ? "8 10 304 176" : "14 14 292 130"}
      role="img"
      aria-label="Azure Air"
      className={className}
    >
      <defs>
        <clipPath id="dawn-crest-shield">
          <path d={SHIELD} />
        </clipPath>
        <path id="dawn-crest-ribbon" d="M108 165 Q160 156 212 165" />
      </defs>

      <Wing />
      <g transform="translate(320 0) scale(-1 1)">
        <Wing />
      </g>

      <g clipPath="url(#dawn-crest-shield)">
        <DawnScene />
      </g>
      <path d={SHIELD} fill="none" stroke="#c9a24a" strokeWidth="3" />
      <polygon points={STAR} fill="#c9a24a" />

      {ribbon && (
        <>
          <path d="M100 154 H82 L90 166 L82 178 H104Z" fill="#9a7a2e" />
          <path d="M220 154 H238 L230 166 L238 178 H216Z" fill="#9a7a2e" />
          <path d="M100 152 Q160 143 220 152 V174 Q160 165 100 174Z" fill="#0b1d3a" stroke="#c9a24a" strokeWidth="1.5" />
          <text fontFamily="var(--font-cinzel)" fontWeight="700" fontSize="13" letterSpacing="4" fill="#e3c06e">
            <textPath href="#dawn-crest-ribbon" startOffset="50%" textAnchor="middle">
              AZURE AIR
            </textPath>
          </text>
        </>
      )}
    </svg>
  );
}
