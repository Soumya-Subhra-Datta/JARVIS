export default function AnimatedOrb({ emotion = 'idle', size = 'normal', speaking = false }) {
  const state = speaking ? 'speaking' : emotion;
  const sizeClass = size === 'small' ? 'small-orb' : '';

  return (
    <div className={`orb-container ${sizeClass}`}>
      <div className={`animated-orb ${state}`}>
        <div className="ring"></div>
        <div className="ring"></div>
        <div className="ring"></div>
        <div className="core"></div>
      </div>
    </div>
  );
}
