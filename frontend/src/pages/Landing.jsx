import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-content">
        <div className="landing-logo">AI</div>
        <h1>JARVIS</h1>
        <p>
          Your intelligent personal assistant powered by advanced AI.
          Chat, manage tasks, analyze data, and automate your workflow.
        </p>
        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
