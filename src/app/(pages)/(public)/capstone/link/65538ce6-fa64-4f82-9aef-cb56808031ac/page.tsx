'use client';
import { supabase } from '@/app/supabase/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface CapstoneLink {
  id: number;
  created_at: string;
  title: string;
  link: string;
}

const Page = () => {
  const [capstoneLinks, setCapstoneLinks] = useState<CapstoneLink[] | null>(null);
  const [errorMsg, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [link, setLink] = useState<string>('');

  useEffect(() => {
    const fetchCapstoneLinks = async () => {
      const { data, error } = await supabase
        .from('capstone_links')
        .select()
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      }
      if (data) {
        console.log(data);
        setCapstoneLinks(data);
      }
    };
    fetchCapstoneLinks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !link) {
      setError('Title and Link are required');
      return;
    }
    const { error } = await supabase.from('capstone_links').insert([{ title, link }]);
    if (error) {
      setError(error.message);
    } else {
      setTitle('');
      setLink('');
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('capstone_links').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      setCapstoneLinks(capstoneLinks?.filter((link) => link.id !== id) || null);
    }
  };
  return (
    <div>
      {errorMsg && (
        <div className="w-full p-2 bg-yellow-400 border-l-4 border-amber-700">
          <h4>{errorMsg}</h4>
        </div>
      )}
      <div className="flex flex-col items-center py-[40px] bg-orange-50 p-[16px] rounded-[8px]">
        <form action="" className="flex flex-col items-start">
          <h1 className="text-2xl font-bold mb-4">Capstone Project Links</h1>
          <p className="mb-4">Below are links related to various capstone projects.</p>
          <Input
            type="text"
            name="title"
            id="title"
            className="border-2 rounded-[8px] p-2 mb-4 w-full bg-white"
            placeholder="Enter link title"
            required
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
          <Input
            type="text"
            name="link"
            id="link"
            className="border-2 rounded-[8px] p-2 mb-4 w-full bg-white"
            placeholder="Enter link URL"
            required
            onChange={(e) => {
              setLink(e.target.value);
            }}
          />
          <Button onClick={handleSubmit} className="w-full">
            Submit
          </Button>
        </form>
      </div>
      <hr />

      {capstoneLinks && capstoneLinks.length > 0 && !errorMsg ? (
        <div className="flex flex-col items-center">
          <div className="flex flex-col max-w-[500px] items-start w-full p-[16px]">
            {capstoneLinks.map((e) => (
              <div
                key={e.id}
                className="flex flex-row justify-between gap-[8px] border-[1px] border-gray-300 rounded-[8px] p-[16px] mb-[16px] w-full"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-md">{e.title}</h3>
                  <p>Created at {new Date(e.created_at).toLocaleString()}</p>
                  <Link href={e.link}>
                    <Button className="bg-orange-500">Visit</Button>
                  </Link>
                </div>
                <Button
                  onClick={() => handleDelete(e.id)}
                  className="bg-red-500 mt-2"
                  size={'icon'}
                >
                  <Trash />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 m-[32px]">No links available</div>
      )}
    </div>
  );
};

export default Page;
