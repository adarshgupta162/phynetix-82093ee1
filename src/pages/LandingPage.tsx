import Link from 'next/link';

// other imports...

function LandingPage() {
  // other code...

  const testSeries = { title: 'Sample Test Series' }; // example testSeries object
  return (
    <div>
      {/* other components... */}
      <Link to={`/enroll/${testSeries.title.toLowerCase().replace(/\s+test\s+series/i, '').replace(/\s+/g, '-').trim()}`}>View Details</Link>
      {/* other components... */}
    </div>
  );
}

export default LandingPage;