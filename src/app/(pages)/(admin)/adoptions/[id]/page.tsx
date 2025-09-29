'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const AdoptionPage = () => {
  const params = useParams();
  const id = params.id as string;
  console.log('id:', id);
  const [adoption, setAdoption] = useState(null);
  useEffect(() => {
    if (id) {
      fetch(`/api/v1/adoption/${id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log(data.data);
          setAdoption(data.data);
        });
    }
  }, [id]);
  return (
    <div>
      {adoption ? (
        adoption['type_of_residence']
      ) : (
        <p className="flex items-center justify-center">Loading...</p>
      )}
    </div>
  );
};

export default AdoptionPage;
