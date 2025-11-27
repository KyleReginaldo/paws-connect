'use client';
import { supabase } from '@/app/supabase/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Json } from '../../../../../database.types';
enum PostCategory {
  SHELTER_UPDATE = 'shelter_update',
  ADOPTION_UPDATE = 'adoption_update',
  RESCUE_STORIES = 'rescue_stories',
  HEALTH_ALERTS = 'health_alerts',
}
interface Post {
  id: number;
  created_at?: string | null | undefined;
  title: string;
  category: 'shelter_update' | 'adoption_update' | 'rescue_stories' | 'health_alerts';
  images?: string[] | null | undefined;
  links?: string[] | null | undefined;
  comments?: Json[] | null | undefined;
  reactions?: Json[] | null | undefined;
  description: string;
}

interface Comment {
  comment: string;
  user_id: string;
  username: string;
  created_at: string;
  profile_image?: string | null;
}

const Page = () => {
  const [category, setCategory] = useState<PostCategory | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    // pre-validate size and type for all files
    if (files.some((f) => f.size > maxSize)) {
      setErrorMsg('One or more selected photos exceed 5MB.');
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      return;
    }
    if (files.some((f) => !allowedTypes.includes(f.type))) {
      setErrorMsg('One or more selected files are not JPEG/PNG/WebP.');
      if (createFileInputRef.current) createFileInputRef.current.value = '';
      return;
    }
    setErrorMsg(null);
    setImageUploading(true);
    try {
      for (const file of files) {
        console.log('[posts] file selected:', {
          name: file.name,
          type: file.type,
          size: file.size,
        });
        if (!allowedTypes.includes(file.type)) {
          console.warn('[posts] invalid file type:', file.type);
          setErrorMsg('Some files were skipped (invalid type)');
          continue;
        }
        if (file.size > maxSize) {
          console.warn('[posts] file too large:', file.size);
          setErrorMsg('Some files were skipped (over 5MB)');
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'posts');
        const resp = await fetch('/api/v1/upload', { method: 'POST', body: formData });
        if (!resp.ok) throw new Error('Failed to upload image');
        const data = await resp.json();
        console.log('[posts] upload response:', data);
        setImageUrls((prev) => [...prev, data.url]);
      }
      setSuccessMsg('Images uploaded');
    } catch (err) {
      console.error('[posts] image upload error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      console.log('[posts] upload finished');
      setImageUploading(false);
      if (createFileInputRef.current) createFileInputRef.current.value = '';
    }
  };
  const removeImageAt = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };
  const [links, setLinks] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLinks, setEditLinks] = useState('');
  const [editCategory, setEditCategory] = useState<PostCategory | undefined>(undefined);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title || '');
    setEditContent(post.description || '');
    setEditLinks(Array.isArray(post.links) ? post.links.join(', ') : '');
    setEditCategory(post.category as PostCategory);
    setEditImageUrls(Array.isArray(post.images) ? post.images : []);
    setEditOpen(true);
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    // pre-validate size and type for all files
    if (files.some((f) => f.size > maxSize)) {
      setErrorMsg('One or more selected photos exceed 5MB.');
      if (editFileInputRef.current) editFileInputRef.current.value = '';
      return;
    }
    if (files.some((f) => !allowedTypes.includes(f.type))) {
      setErrorMsg('One or more selected files are not JPEG/PNG/WebP.');
      if (editFileInputRef.current) editFileInputRef.current.value = '';
      return;
    }
    setErrorMsg(null);
    setEditImageUploading(true);
    try {
      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          setErrorMsg('Some files were skipped (invalid type)');
          continue;
        }
        if (file.size > maxSize) {
          setErrorMsg('Some files were skipped (over 5MB)');
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'posts');
        const resp = await fetch('/api/v1/upload', { method: 'POST', body: formData });
        if (!resp.ok) throw new Error('Failed to upload image');
        const data = await resp.json();
        setEditImageUrls((prev) => [...prev, data.url]);
      }
      setSuccessMsg('Images uploaded');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setEditImageUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };
  const removeEditImageAt = (idx: number) => {
    setEditImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    if (editImageUploading) {
      setErrorMsg('Please wait for image upload to finish');
      return;
    }
    if (!editTitle.trim() || !editContent.trim()) {
      setErrorMsg('Title and content are required');
      return;
    }
    const linkArray = editLinks
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    try {
      setEditSubmitting(true);
      const { error } = await supabase
        .from('posts')
        .update({
          title: editTitle,
          description: editContent,
          category: editCategory,
          links: linkArray.length ? linkArray : null,
          images: editImageUrls.length ? editImageUrls : null,
        })
        .eq('id', editingPost.id);
      if (error) throw new Error(error.message);
      await fetchPosts();
      setSuccessMsg('Post updated successfully');
      setEditOpen(false);
      setEditingPost(null);
    } catch (err) {
      console.error('[posts] update post error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (submitting) return;
    if (imageUploading) {
      setErrorMsg('Please wait for image upload to finish');
      return;
    }
    if (!category) {
      setErrorMsg('Please select a category');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Title and content are required');
      return;
    }
    const linkArray = links
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    try {
      setSubmitting(true);
      const payload = {
        title,
        category,
        // DB expects text[]; send array when present
        images: imageUrls.length ? imageUrls : null,
        links: linkArray.length ? linkArray : null,
        description: content,
      };
      console.log('[posts] creating post with payload:', payload);
      const { error } = await supabase.from('posts').insert({
        ...payload,
      });
      if (error) throw new Error(error.message);
      console.log('[posts] post created successfully');
      setSuccessMsg('Post created successfully');
      await fetchPosts();
      setTitle('');
      setContent('');
      setImageUrls([]);
      setLinks('');
      setCategory(undefined);
    } catch (err) {
      console.error('[posts] create post error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      console.log('[posts] submit finished');
      setSubmitting(false);
    }
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<Comment[]>([]);
  const [selectedPostTitle, setSelectedPostTitle] = useState('');

  const openComments = (post: Post) => {
    setSelectedPostTitle(post.title);
    setSelectedPostComments(
      Array.isArray(post.comments) ? (post.comments as unknown as Comment[]) : [],
    );
    setCommentsOpen(true);
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Delete this post? This action cannot be undone.')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setDeletingId(id);
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await fetchPosts();
      setSuccessMsg('Post deleted');
    } catch (err) {
      console.error('[posts] delete post error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select()
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[posts] fetch posts error:', error);
      setErrorMsg(error.message);
      return;
    }
    if (data) {
      console.log('[posts] fetched posts:', data);
      setPosts(data);
    }
  };
  useEffect(() => {
    fetchPosts();
  }, []);
  return (
    <div className="flex flex-col items-center md:flex-row md:justify-center md:items-start gap-[16px]">
      <form
        onSubmit={handleSubmit}
        className="max-w-[500px] w-full flex flex-col gap-[16px] m-[20px] p-[20px]"
      >
        <h3>Create Post</h3>
        {errorMsg && (
          <div className="w-full p-2 bg-yellow-100 border-l-4 border-yellow-400 text-sm">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="w-full p-2 bg-green-100 border-l-4 border-green-400 text-sm">
            {successMsg}
          </div>
        )}
        <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Categories</SelectLabel>
              <SelectItem value={PostCategory.SHELTER_UPDATE}>Shelter Update</SelectItem>
              <SelectItem value={PostCategory.ADOPTION_UPDATE}>Adoption Update</SelectItem>
              <SelectItem value={PostCategory.RESCUE_STORIES}>Rescue Stories</SelectItem>
              <SelectItem value={PostCategory.HEALTH_ALERTS}>Health Alerts</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          type="text"
          name="title"
          placeholder="Enter title"
          className="w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          name="content"
          placeholder="Enter content"
          className="w-full"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></Textarea>
        <div className="flex flex-col items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            multiple
            className=""
            onChange={handleFileChange}
            ref={createFileInputRef}
          />
          {imageUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 w-full">
              {imageUrls.map((url, idx) => (
                <div
                  key={url + idx}
                  className="relative h-[100px] rounded-md border bg-white overflow-hidden"
                >
                  <Image src={url} alt={`Post image ${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-600 text-xs px-2 py-0.5 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative w-full h-[100px] rounded-md border bg-white overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                No image
              </div>
            </div>
          )}
        </div>
        <Input
          type="text"
          name="links"
          placeholder="Links (comma separated, optional)"
          className="w-full"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
        />
        <Button type="submit" className="bg-orange-500" disabled={submitting || imageUploading}>
          {submitting ? 'Creating...' : 'Create Post'}
        </Button>
      </form>
      <div className="flex flex-col w-full md:w-[45%] h-auto md:h-[100vh] p-[20px] overflow-visible md:overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Posts</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              fetchPosts();
            }}
            className="h-8"
          >
            Refresh
          </Button>
        </div>
        {posts && posts.length > 0 ? (
          posts?.map((e) => {
            const imgs = Array.isArray(e.images) ? (e.images as string[]).filter(Boolean) : [];
            const created = e.created_at ? new Date(e.created_at).toLocaleString() : '';
            return (
              <div key={e.id} className="bg-white rounded-lg border shadow-sm mb-4">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="size-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold">
                    {e.title?.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight truncate">{e.title}</p>
                    <p className="text-xs text-gray-500">{created}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => openEdit(e)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeletePost(e.id)}
                      disabled={deletingId === e.id}
                    >
                      {deletingId === e.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
                {/* Content */}
                {e.description && (
                  <div className="px-4 pb-3">
                    <p className="text-sm whitespace-pre-wrap">{e.description}</p>
                  </div>
                )}
                {e.links && Array.isArray(e.links) && e.links.length > 0 && (
                  <div className="px-4 pb-3">
                    <h4 className="font-medium mb-1">Links:</h4>
                    <ul className="list-none">
                      {e.links!.map((link: string, idx: number) => (
                        <li key={idx}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 underline"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Images collage */}
                {imgs.length > 0 && (
                  <div className="w-full px-4 pb-4">
                    {imgs.length === 1 && (
                      <div className="relative w-full h-[240px] rounded-lg overflow-hidden">
                        <Image src={imgs[0]} alt={e.title} fill className="object-cover" />
                      </div>
                    )}
                    {imgs.length === 2 && (
                      <div className="grid grid-cols-2 gap-2">
                        {imgs.slice(0, 2).map((src, i) => (
                          <div
                            key={src + i}
                            className="relative h-[200px] rounded-lg overflow-hidden"
                          >
                            <Image
                              src={src}
                              alt={`${e.title} ${i + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {imgs.length === 3 && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative h-[240px] rounded-lg overflow-hidden">
                          <Image src={imgs[0]} alt={`${e.title} 1`} fill className="object-cover" />
                        </div>
                        <div className="grid gap-2">
                          {imgs.slice(1, 3).map((src, i) => (
                            <div
                              key={src + i}
                              className="relative h-[118px] rounded-lg overflow-hidden"
                            >
                              <Image
                                src={src}
                                alt={`${e.title} ${i + 2}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {imgs.length >= 4 && (
                      <div className="grid grid-cols-2 gap-2">
                        {imgs.slice(0, 4).map((src, i) => (
                          <div
                            key={src + i}
                            className="relative h-[160px] rounded-lg overflow-hidden"
                          >
                            <Image
                              src={src}
                              alt={`${e.title} ${i + 1}`}
                              fill
                              className="object-cover"
                            />
                            {i === 3 && imgs.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-semibold">
                                +{imgs.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Footer actions */}
                <div className="px-4 py-2 border-t flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <button type="button" className="text-orange-600">
                      {Array.isArray(e.reactions) ? e.reactions.length : 0} Reaction
                      {Array.isArray(e.reactions) && e.reactions.length !== 1 ? 's' : ''}
                    </button>
                    <button
                      type="button"
                      className="text-orange-600"
                      onClick={() => openComments(e)}
                    >
                      {Array.isArray(e.comments) ? e.comments.length : 0} Comment
                      {Array.isArray(e.comments) && e.comments.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center">No posts available</div>
        )}
      </div>
      {/* Edit Post Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePost} className="flex flex-col gap-3">
            <Select value={editCategory} onValueChange={(v) => setEditCategory(v as PostCategory)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categories</SelectLabel>
                  <SelectItem value={PostCategory.SHELTER_UPDATE}>Shelter Update</SelectItem>
                  <SelectItem value={PostCategory.ADOPTION_UPDATE}>Adoption Update</SelectItem>
                  <SelectItem value={PostCategory.RESCUE_STORIES}>Rescue Stories</SelectItem>
                  <SelectItem value={PostCategory.HEALTH_ALERTS}>Health Alerts</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Enter title"
              className="w-full"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Enter content"
              className="w-full"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
            ></Textarea>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditFileChange}
                ref={editFileInputRef}
              />
              {editImageUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 w-full">
                  {editImageUrls.map((url, idx) => (
                    <div
                      key={url + idx}
                      className="relative h-[100px] rounded-md border bg-white overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`Post image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditImageAt(idx)}
                        className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-600 text-xs px-2 py-0.5 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative w-full h-[100px] rounded-md border bg-white overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                    No image
                  </div>
                </div>
              )}
            </div>
            <Input
              type="text"
              placeholder="Links (comma separated)"
              className="w-full"
              value={editLinks}
              onChange={(e) => setEditLinks(e.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500"
                disabled={editSubmitting || editImageUploading}
              >
                {editSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Comments Modal */}
      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments - {selectedPostTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {selectedPostComments.length > 0 ? (
              selectedPostComments.map((comment: Comment, idx: number) => (
                <div key={idx} className="flex gap-3 pb-3 border-b last:border-b-0">
                  <div className="flex-shrink-0">
                    {comment.profile_image ? (
                      <div className="relative size-10 rounded-full overflow-hidden">
                        <Image
                          src={comment.profile_image}
                          alt={comment.username || 'User'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold">
                        {(comment.username || 'U').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{comment.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        {comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{comment.comment}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No comments yet</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
