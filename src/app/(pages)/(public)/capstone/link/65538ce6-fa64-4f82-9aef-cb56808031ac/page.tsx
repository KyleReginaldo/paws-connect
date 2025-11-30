'use client';
import { supabase } from '@/app/supabase/supabase';
import { AdminImageSelector } from '@/components/AdminImageSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface CapstoneLink {
  id: number;
  created_at: string;
  title: string;
  link: string;
  description?: string | null;
  image_link?: string | null;
  button_label?: string | null;
}

const Page = () => {
  const [capstoneLinks, setCapstoneLinks] = useState<CapstoneLink[] | null>(null);
  const [errorMsg, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageLink, setImageLink] = useState<string>('');
  const [buttonLabel, setButtonLabel] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
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
  useEffect(() => {
    fetchCapstoneLinks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || title.trim().length === 0 || !link || link.trim().length === 0) {
      setError('Title and Link are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('capstone_links').insert([
        {
          title: title.trim(),
          link: link.trim(),
          description: description.trim() || null,
          image_link: imageLink.trim() || null,
          button_label: buttonLabel.trim() || null,
        },
      ]);
      if (error) {
        setError(error.message);
      } else {
        setTitle('');
        setLink('');
        setDescription('');
        setImageLink('');
        setButtonLabel('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
      await fetchCapstoneLinks();
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setIsDeleting(id);
    try {
      const { error } = await supabase.from('capstone_links').delete().eq('id', id);
      if (error) {
        setError(error.message);
      } else {
        setCapstoneLinks(capstoneLinks?.filter((link) => link.id !== id) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(null);
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
        <form onSubmit={handleSubmit} className="flex flex-col items-start">
          <h1 className="text-2xl font-bold mb-4">Capstone Project Links</h1>
          <p className="mb-4">Below are links related to various capstone projects.</p>
          <Input
            type="text"
            name="title"
            id="title"
            className="border-2 rounded-[8px] p-2 mb-4 w-full bg-white"
            placeholder="Enter link title"
            value={title}
            required
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
          <Input
            type="text"
            name="link"
            id="link"
            value={link}
            className="border-2 rounded-[8px] p-2 mb-4 w-full bg-white"
            placeholder="Enter link URL"
            required
            onChange={(e) => {
              setLink(e.target.value);
            }}
          />
          <Input
            type="text"
            name="description"
            id="description"
            value={description}
            className="border-2 rounded-[8px] p-2 mb-4 w-full bg-white"
            placeholder="Enter description (optional)"
            onChange={(e) => {
              setDescription(e.target.value);
            }}
          />
          <div className="flex items-center gap-4 mb-4 w-full">
            <AdminImageSelector
              currentImage={imageLink || undefined}
              onImageSelect={(url) => setImageLink(url)}
              userInitials={(title?.trim()?.slice(0, 2) || 'CL').toUpperCase()}
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Or paste an image URL:</p>
              <Input
                type="text"
                name="image_link"
                id="image_link"
                value={imageLink}
                className="border-2 rounded-[8px] p-2 w-full bg-white"
                placeholder="Enter image URL (optional)"
                onChange={(e) => {
                  setImageLink(e.target.value);
                }}
              />
            </div>
          </div>
          <Input
            type="text"
            name="button_label"
            id="button_label"
            value={buttonLabel}
            className="border-2 rounded-[8px] p-2 mb-4 w-full bg-white"
            placeholder="Enter button label (optional)"
            onChange={(e) => {
              setButtonLabel(e.target.value);
            }}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit'}
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
                  {e.description && <p className="text-sm text-gray-700">{e.description}</p>}
                  {e.image_link && (
                    <Image
                      src={e.image_link}
                      alt={e.title}
                      width={240}
                      height={240}
                      className="w-full max-w-[240px] rounded-[8px] border"
                    />
                  )}
                  <Link href={e.link}>
                    <Button className="bg-orange-500">
                      {e.button_label ? e.button_label : 'Visit'}
                    </Button>
                  </Link>
                </div>
                <Button
                  onClick={() => handleDelete(e.id)}
                  disabled={isDeleting === e.id}
                  className="bg-red-500 mt-2"
                  size={'icon'}
                >
                  {isDeleting === e.id ? '...' : <Trash />}
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
