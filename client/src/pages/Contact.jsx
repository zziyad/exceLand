import React from 'react';

export default function Home() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Kateqoriyalar</h2>
      <h3 className="text-lg font-semibold mb-2">
        Təhsil məsələləri üzrə məsləhətçi
      </h3>
      <div className="mb-6">
        <p className="text-gray-700">Əlaqə məlumatları:</p>
        <ul className="list-disc pl-6">
          <li className="mt-2">
            050 455 67 68 <span className="text-gray-600">- Mobil</span>
          </li>
          <li className="mt-2">
            info@exceland.az{' '}
            <span className="text-gray-600">- E-poçt ünvanı</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
