'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Loader2, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DocumentsPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  interface Document {
    id: string;
    title: string;
    description: string | null;
    url: string;
    createdAt: string;
  }

  const [documents, setDocuments] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingDoc, setEditingDoc] = useState<Omit<Document, 'url' | 'createdAt'> | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !editingDoc) return;

    setIsUploading(true);

    try {
      if (editingDoc) {
        // Handle document update
        const response = await fetch(`/api/documents/${editingDoc.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            description,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update document');
        }

        const updatedDoc = await response.json();
        setDocuments(documents.map(doc =>
          doc.id === updatedDoc.id ? { ...doc, ...updatedDoc } : doc
        ));

        setEditingDoc(null);
        setTitle('');
        setDescription('');

        toast({
          title: 'Success',
          description: 'Document updated successfully!',
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload document');
        }

        const data = await response.json();
        setDocuments([data, ...documents]);
        setShowUploadForm(false);
        setFile(null);
        setTitle('');
        setDescription('');

        toast({
          title: 'Success',
          description: 'Document uploaded and processed successfully!',
        });
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingDoc ? 'update' : 'upload'} document. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(docId);
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter(doc => doc.id !== docId));

      toast({
        title: 'Success',
        description: 'Document deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const startEditing = (doc: Document) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setDescription(doc.description || '');
  };

  const cancelEditing = () => {
    setEditingDoc(null);
    setTitle('');
    setDescription('');
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Documents</h1>
        <Button
          className="min-w-[150px] bg-teal-500 text-white"
          onClick={() => setShowUploadForm(!showUploadForm)}>
          <Upload className="mr-2 h-4 w-4" />
          {showUploadForm ? 'Cancel' : 'Upload Document'}
        </Button>
      </div>

      {(showUploadForm || editingDoc) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingDoc ? 'Edit Document' : 'Upload New Document'}</CardTitle>
            <CardDescription>
              {editingDoc
                ? 'Update the document details below.'
                : 'Upload a document (PDF, Word, Excel, PowerPoint, or Text) to start asking questions about it.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-4">
                {!editingDoc && (
                  <div className="flex flex-col space-y-1.5">
                    <label
                      htmlFor="document"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Document
                    </label>
                    <Input
                      id="document"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      required={!editingDoc}
                    />
                  </div>
                )}
                <div className="flex flex-col space-y-1.5">
                  <label
                    htmlFor="title"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Document title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Description (optional)
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the document"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={editingDoc ? cancelEditing : () => setShowUploadForm(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || (!editingDoc && !file) || !title}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingDoc ? 'Updating...' : 'Uploading...'}
                  </>
                ) : editingDoc ? (
                  'Update Document'
                ) : (
                  'Upload Document'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <CardTitle className="text-lg truncate" title={doc.title}>
                      {doc.title}
                    </CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEditing(doc)}
                      disabled={!!editingDoc || isDeleting === doc.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={!!editingDoc || isDeleting === doc.id}
                        >
                          {isDeleting === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Document</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p>Are you sure you want to delete `{doc.title}`? This action cannot be undone.</p>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            const trigger = document.querySelector('[aria-label="Close"]') as HTMLButtonElement;
                            trigger?.click();
                          }}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              handleDelete(doc.id);
                              const trigger = document.querySelector('[aria-label="Close"]') as HTMLButtonElement;
                              trigger?.click();
                            }}
                            disabled={isDeleting === doc.id}
                          >
                            {isDeleting === doc.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : 'Delete'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <CardDescription>
                  {new Date(doc.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = `/documents/${doc.id}`}
                >
                  View Document
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No documents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by uploading a document
          </p>
          <Button onClick={() => setShowUploadForm(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      )}
    </div>
  );
}
