
import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Tag,
  Check,
  Image
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "../../hooks/use-toast";
import { useContent } from "../../context/ContentContext";
import type { ExtendedBlogPostType } from "../../types/content-types";

const ProjectEditor = () => {
  const { blogPosts, saveBlogPost, deleteBlogPost, isEditMode } = useContent();
  
  // Filter only projects
  const projects = blogPosts.filter(post => post.category === 'Project');
  
  const [selectedProject, setSelectedProject] = useState<ExtendedBlogPostType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  
  // Reset form when edit mode changes
  useEffect(() => {
    if (!isEditMode && selectedProject) {
      handleSelectProject(selectedProject);
    }
  }, [isEditMode]);
  
  const handleSelectProject = (project: ExtendedBlogPostType) => {
    if (!isEditMode && selectedProject?.id !== project.id) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to select a different project.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedProject(project);
    setTitle(project.title);
    setDescription(project.excerpt || "");
    setDetailedDescription(project.detailedDescription || "");
    setTags(project.tags || []);
    setFeatures(project.features || []);
    setTechnologies(project.technologies || []);
    setImageUrl(project.imageUrl || "");
    setLink(project.id || "");
  };
  
  const handleNewProject = () => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to create a new project.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedProject(null);
    setTitle("");
    setDescription("");
    setDetailedDescription("");
    setTags([]);
    setFeatures([]);
    setTechnologies([]);
    setImageUrl("");
    setLink("");
  };
  
  const handleAddTag = () => {
    if (!isEditMode) return;
    
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    if (!isEditMode) return;
    
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleAddFeature = () => {
    if (!isEditMode) return;
    
    if (featureInput && !features.includes(featureInput)) {
      setFeatures([...features, featureInput]);
      setFeatureInput("");
    }
  };
  
  const handleRemoveFeature = (featureToRemove: string) => {
    if (!isEditMode) return;
    
    setFeatures(features.filter(feature => feature !== featureToRemove));
  };
  
  const handleAddTechnology = () => {
    if (!isEditMode) return;
    
    if (techInput && !technologies.includes(techInput)) {
      setTechnologies([...technologies, techInput]);
      setTechInput("");
    }
  };
  
  const handleRemoveTechnology = (techToRemove: string) => {
    if (!isEditMode) return;
    
    setTechnologies(technologies.filter(tech => tech !== techToRemove));
  };
  
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // In a real app, we would upload to a server here
      // For now, create an object URL as a placeholder
      const imgUrl = URL.createObjectURL(file);
      setImageUrl(imgUrl);
      
      toast({
        title: "Image Selected",
        description: "Project image has been selected.",
        variant: "default",
      });
    }
  };
  
  const handleSaveProject = () => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to save changes.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your project.",
        variant: "destructive",
      });
      return;
    }
    
    const projectToSave: ExtendedBlogPostType = {
      id: selectedProject ? selectedProject.id : `project-${Date.now()}`,
      title,
      excerpt: description,
      content: detailedDescription,
      category: "Project",
      tags,
      date: selectedProject?.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      readTime: "5 min read",
      authorName: "ASSAD",
      authorRole: "AI & Automation Expert",
      technologies,
      features,
      detailedDescription,
      imageUrl,
      featuredImage: imageUrl
    };
    
    saveBlogPost(projectToSave);
    
    toast({
      title: selectedProject ? "Project Updated" : "Project Created",
      description: selectedProject 
        ? "Your project has been updated successfully." 
        : "Your new project has been created successfully.",
      variant: "default",
    });
    
    if (!selectedProject) {
      setSelectedProject(projectToSave);
    }
  };
  
  const handleDeleteProject = (projectId: string) => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to delete projects.",
        variant: "destructive",
      });
      return;
    }
    
    deleteBlogPost(projectId);
    if (selectedProject && selectedProject.id === projectId) {
      handleNewProject();
    }
    
    toast({
      title: "Project Deleted",
      description: "The project has been deleted successfully.",
      variant: "destructive",
    });
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Projects</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleNewProject}
                disabled={!isEditMode}
              >
                <Plus size={16} className="mr-1" /> New Project
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${
                    selectedProject && selectedProject.id === project.id ? 'bg-zinc-100 border-zinc-300' : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                  onClick={() => handleSelectProject(project)}
                >
                  <div>
                    <h3 className="font-medium text-sm">{project.title}</h3>
                    <p className="text-xs text-zinc-500 truncate">{project.description.substring(0, 50)}...</p>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    disabled={!isEditMode}
                  >
                    <Trash2 size={16} className={isEditMode ? "text-zinc-500 hover:text-red-500" : "text-zinc-300"} />
                  </Button>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center p-4 text-zinc-500">
                  No projects yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{selectedProject ? 'Edit Project' : 'New Project'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-title">Project Title</Label>
                <Input 
                  id="project-title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter project title"
                  disabled={!isEditMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Short Description</Label>
                <Textarea 
                  id="project-description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Brief description of the project"
                  disabled={!isEditMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-link">Project Link</Label>
                <Input 
                  id="project-link" 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="e.g. /projects/project-name"
                  disabled={!isEditMode}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  This will be auto-generated if left empty
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-detailed">Detailed Description</Label>
                <Textarea 
                  id="project-detailed" 
                  value={detailedDescription} 
                  onChange={(e) => setDetailedDescription(e.target.value)} 
                  placeholder="Comprehensive description of the project" 
                  rows={6}
                  disabled={!isEditMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-tags">Tags</Label>
                <div className="flex gap-2">
                  <Input 
                    id="project-tags" 
                    value={tagInput} 
                    onChange={(e) => setTagInput(e.target.value)} 
                    placeholder="Add a tag" 
                    className="flex-1"
                    disabled={!isEditMode}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isEditMode) {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddTag}
                    disabled={!isEditMode}
                  >
                    <Tag size={16} />
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {tag}
                        <button 
                          type="button" 
                          className={isEditMode ? "text-zinc-500 hover:text-red-500" : "text-zinc-300"}
                          onClick={() => handleRemoveTag(tag)}
                          disabled={!isEditMode}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-features">Features</Label>
                <div className="flex gap-2">
                  <Input 
                    id="project-features" 
                    value={featureInput} 
                    onChange={(e) => setFeatureInput(e.target.value)} 
                    placeholder="Add a feature" 
                    className="flex-1"
                    disabled={!isEditMode}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isEditMode) {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddFeature}
                    disabled={!isEditMode}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                {features.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {features.map((feature, index) => (
                      <li 
                        key={index} 
                        className="flex justify-between items-center bg-zinc-50 p-2 rounded border border-zinc-100"
                      >
                        <span>{feature}</span>
                        <button 
                          type="button" 
                          className={isEditMode ? "text-zinc-500 hover:text-red-500" : "text-zinc-300"}
                          onClick={() => handleRemoveFeature(feature)}
                          disabled={!isEditMode}
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-technologies">Technologies</Label>
                <div className="flex gap-2">
                  <Input 
                    id="project-technologies" 
                    value={techInput} 
                    onChange={(e) => setTechInput(e.target.value)} 
                    placeholder="Add a technology" 
                    className="flex-1"
                    disabled={!isEditMode}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isEditMode) {
                        e.preventDefault();
                        handleAddTechnology();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddTechnology}
                    disabled={!isEditMode}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                {technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {technologies.map((tech, index) => (
                      <span 
                        key={index} 
                        className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        {tech}
                        <button 
                          type="button" 
                          className={isEditMode ? "text-zinc-500 hover:text-red-500" : "text-zinc-300"}
                          onClick={() => handleRemoveTechnology(tech)}
                          disabled={!isEditMode}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-image">Project Image</Label>
                <div className="flex gap-2">
                  <Input 
                    id="project-image" 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageSelection}
                    className="flex-1"
                    disabled={!isEditMode}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => document.getElementById('project-image')?.click()}
                    disabled={!isEditMode}
                  >
                    <Image size={16} />
                  </Button>
                </div>
                
                {imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={imageUrl} 
                      alt="Project" 
                      className="h-20 object-cover rounded" 
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleNewProject}>Cancel</Button>
            <Button 
              onClick={handleSaveProject}
              disabled={!isEditMode || !title}
            >
              <Save size={16} className="mr-1" />
              {selectedProject ? 'Update Project' : 'Save Project'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ProjectEditor;
