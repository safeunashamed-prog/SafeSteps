import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Help from './Help';
import Understand from './Understand';
import Triggers from './Triggers';
import CheckIn from './CheckIn';
import Victories from './Victories';
import Grounding from './Grounding';
import Learn from './Learn';
import Profile from './Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/help" element={<Help />} />
      <Route path="/understand" element={<Understand />} />
      <Route path="/triggers" element={<Triggers />} />
      <Route path="/check-in" element={<CheckIn />} />
      <Route path="/victories" element={<Victories />} />
      <Route path="/grounding" element={<Grounding />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}
