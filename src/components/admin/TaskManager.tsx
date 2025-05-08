import { useState, useEffect } from 'react';
import { useContent } from '../../context/ContentContext';
import { Task, TaskStatus } from '../../types/content-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CheckCircle, Clock, Eye, MessageSquare, Plus, ChevronRight, Check, X, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To-do', color: 'bg-orange-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'in-review', label: 'In-Review', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

const ItemTypes = {
  TASK: 'task',
};

interface TaskDragItem {
  id: string;
  status: TaskStatus;
}

const DraggableTaskCard = ({ task, renderTaskCard }: { task: Task, renderTaskCard: (task: Task) => React.ReactNode }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, status: task.status } as TaskDragItem,
    canDrag: () => true,
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ status: TaskStatus }>();
      if (!dropResult) {
        console.log('Drag cancelled or dropped outside valid target');
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="cursor-move"
      draggable="true"
    >
      {renderTaskCard(task)}
    </div>
  );
};

const DroppableColumn = ({ 
  status, 
  children, 
  onDrop 
}: { 
  status: TaskStatus, 
  children: React.ReactNode, 
  onDrop: (id: string, status: TaskStatus) => void 
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: TaskDragItem) => {
      onDrop(item.id, status);
      return { status }; // Return the status to confirm successful drop
    },
    canDrop: (item: TaskDragItem) => item.status !== status, // Only allow dropping in different columns
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  // Enhanced visual feedback
  const isActive = isOver && canDrop;

  return (
    <div 
      ref={drop}
      className={cn(
        "bg-white dark:bg-zinc-800/50 rounded-lg p-3 sm:p-4 border border-zinc-200 dark:border-zinc-700/50 transition-colors",
        isActive && "bg-zinc-100 dark:bg-zinc-700/80 border-dashed border-2 border-blue-500 dark:border-blue-400",
        isOver && !canDrop && "border-dashed border-2 border-red-400 dark:border-red-500/50" // Invalid drop target 
      )}
      role="Droppable"
      aria-disabled="false"
    >
      {children}
    </div>
  );
};

const QuickTaskForm = ({ status, onAdd }: { status: TaskStatus; onAdd: (title: string, status: TaskStatus) => void }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), status);
      setTitle("");
    }
  };

  const handleClear = () => {
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="pr-16 bg-white dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-600"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            <Button 
              type="submit" 
              size="sm" 
              className="h-7 px-3"
              disabled={!title.trim()}
            >
              Add
            </Button>
          </div>
        </div>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="px-2 h-9 text-zinc-500"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

const TaskManager = () => {
  const { tasks, saveTask, deleteTask, updateTaskStatus, isLoading } = useContent();
  const [activeView, setActiveView] = useState('todo');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Partial<Task> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const inReviewTasks = tasks.filter(task => task.status === 'in-review');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const handleNewTask = () => {
    setTaskBeingEdited({
      title: '',
      description: '',
      status: 'todo',
      points: 50,
      assignees: [],
    });
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskBeingEdited(task);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (taskBeingEdited) {
      await saveTask(taskBeingEdited);
      setIsTaskDialogOpen(false);
      setTaskBeingEdited(null);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTaskToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateTaskStatus(id, status);
  };

  const handleTaskDrop = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      console.log(`Moving task from ${task.status} to ${newStatus}`);
      try {
        await updateTaskStatus(taskId, newStatus);
      } catch (error) {
        console.error('Error moving task:', error);
        // You could add error handling UI here if needed
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskBeingEdited(prev => {
      if (!prev) return prev;
      if (name === 'assignees') {
        // Split comma-separated string into an array, trimming whitespace
        const assigneesArray = value.split(',').map(s => s.trim()).filter(s => s);
        return { ...prev, assignees: assigneesArray };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  const handlePointsChange = (value: number) => {
    setTaskBeingEdited(prev => (prev ? { ...prev, points: value } : prev));
  };

  const handleQuickAddTask = async (title: string, status: TaskStatus) => {
    const newTask: Partial<Task> = {
      title,
      description: '',
      status,
      points: 50,
      assignees: [],
    };
    await saveTask(newTask);
  };

  const renderTaskCard = (task: Task) => (
    <Card 
      key={task.id} 
      className="mb-3 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-all relative group"
    >
      <CardHeader className="pb-2 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Badge className={cn(
              "px-2 py-1 w-fit",
              task.status === 'todo' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" :
              task.status === 'in-progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
              task.status === 'in-review' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" :
              "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            )}>
              {task.points} Points
            </Badge>
            {task.dueDate && (
              <span className="text-xs text-zinc-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleEditTask(task)} className="h-8">
            Edit
          </Button>
        </div>
        <CardTitle className="text-base font-medium line-clamp-2 cursor-pointer" onClick={() => handleEditTask(task)}>{task.title}</CardTitle>
      </CardHeader>
      <CardContent onClick={() => handleEditTask(task)} className="cursor-pointer">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {task.description}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center flex-wrap gap-2">
        <div className="flex -space-x-2">
          {task.assignees.length > 0 ? (
            task.assignees.slice(0, 3).map((assignee, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-white dark:border-zinc-800">
                <AvatarFallback className="text-xs">
                  {assignee.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <span className="text-xs text-zinc-400">Unassigned</span>
          )}
          {task.assignees.length > 3 && (
            <Avatar className="h-6 w-6 border-2 border-white dark:border-zinc-800">
              <AvatarFallback className="text-xs">+{task.assignees.length - 3}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-1" /> {task.viewCount || 0}
          </span>
          <span className="flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" /> {task.comments || 0}
          </span>
        </div>
      </CardFooter>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-7 w-7 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteTask(task.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete task</span>
      </Button>
    </Card>
  );

  const renderTaskListItem = (task: Task) => (
    <div 
      key={task.id} 
      className="flex items-start gap-2 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <div className="flex-shrink-0 pt-0.5">
        {task.status === 'completed' ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            onClick={() => handleStatusChange(task.id, 'todo')}
          >
            <Check className="h-3 w-3" />
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="icon" 
            className="h-5 w-5 rounded-full"
            onClick={() => handleStatusChange(task.id, 'completed')}
          >
            <span className="sr-only">Complete task</span>
          </Button>
        )}
      </div>
      
      <div className="flex-grow min-w-0 cursor-pointer" onClick={() => handleEditTask(task)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                "text-sm font-medium truncate",
                task.status === 'completed' && "line-through text-zinc-400 dark:text-zinc-500"
              )}>
                {task.title}
              </h4>
              <Badge className={cn(
                "px-1.5 py-0.5 text-xs shrink-0",
                task.status === 'todo' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" :
                task.status === 'in-progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                task.status === 'in-review' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" :
                "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              )}>
                {task.status}
              </Badge>
            </div>
            {task.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                {task.description}
              </p>
            )}
            {task.dueDate && (
              <div className="flex items-center text-xs text-zinc-500 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {task.assignees.length > 0 && (
              <div className="flex -space-x-2 mr-1">
                {task.assignees.slice(0, 2).map((assignee, index) => (
                  <Avatar key={index} className="h-5 w-5 border-2 border-white dark:border-zinc-800">
                    <AvatarFallback className="text-xs">
                      {assignee.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 2 && (
                  <Avatar className="h-5 w-5 border-2 border-white dark:border-zinc-800">
                    <AvatarFallback className="text-xs">+{task.assignees.length - 2}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-zinc-400 hover:text-zinc-500" 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask(task.id);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKanbanView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DroppableColumn status="todo" onDrop={handleTaskDrop}>
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
          <h3 className="font-medium text-sm sm:text-base">To-do</h3>
          <Badge variant="outline" className="ml-2 text-xs">{todoTasks.length}</Badge>
          <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 sm:h-8 sm:w-8" onClick={handleNewTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <QuickTaskForm status="todo" onAdd={handleQuickAddTask} />
        <ScrollArea className="h-[calc(100vh-350px)] min-h-[250px] sm:min-h-[300px]">
          {todoTasks.map(task => (
            <DraggableTaskCard key={task.id} task={task} renderTaskCard={renderTaskCard} />
          ))}
          {todoTasks.length === 0 && (
            <div className="text-center p-4 text-zinc-400 dark:text-zinc-500 text-sm">
              No to-do tasks
            </div>
          )}
        </ScrollArea>
      </DroppableColumn>

      <DroppableColumn status="in-progress" onDrop={handleTaskDrop}>
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
          <h3 className="font-medium text-sm sm:text-base">In Progress</h3>
          <Badge variant="outline" className="ml-2 text-xs">{inProgressTasks.length}</Badge>
          <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 sm:h-8 sm:w-8" onClick={handleNewTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <QuickTaskForm status="in-progress" onAdd={handleQuickAddTask} />
        <ScrollArea className="h-[calc(100vh-350px)] min-h-[250px] sm:min-h-[300px]">
          {inProgressTasks.map(task => (
            <DraggableTaskCard key={task.id} task={task} renderTaskCard={renderTaskCard} />
          ))}
          {inProgressTasks.length === 0 && (
            <div className="text-center p-4 text-zinc-400 dark:text-zinc-500 text-sm">
              No in-progress tasks
            </div>
          )}
        </ScrollArea>
      </DroppableColumn>

      <DroppableColumn status="in-review" onDrop={handleTaskDrop}>
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
          <h3 className="font-medium text-sm sm:text-base">In Review</h3>
          <Badge variant="outline" className="ml-2 text-xs">{inReviewTasks.length}</Badge>
          <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 sm:h-8 sm:w-8" onClick={handleNewTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <QuickTaskForm status="in-review" onAdd={handleQuickAddTask} />
        <ScrollArea className="h-[calc(100vh-350px)] min-h-[250px] sm:min-h-[300px]">
          {inReviewTasks.map(task => (
            <DraggableTaskCard key={task.id} task={task} renderTaskCard={renderTaskCard} />
          ))}
          {inReviewTasks.length === 0 && (
            <div className="text-center p-4 text-zinc-400 dark:text-zinc-500 text-sm">
              No in-review tasks
            </div>
          )}
        </ScrollArea>
      </DroppableColumn>

      <DroppableColumn status="completed" onDrop={handleTaskDrop}>
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          <h3 className="font-medium text-sm sm:text-base">Completed</h3>
          <Badge variant="outline" className="ml-2 text-xs">{completedTasks.length}</Badge>
          <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 sm:h-8 sm:w-8" onClick={handleNewTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <QuickTaskForm status="completed" onAdd={handleQuickAddTask} />
        <ScrollArea className="h-[calc(100vh-350px)] min-h-[250px] sm:min-h-[300px]">
          {completedTasks.map(task => (
            <DraggableTaskCard key={task.id} task={task} renderTaskCard={renderTaskCard} />
          ))}
          {completedTasks.length === 0 && (
            <div className="text-center p-4 text-zinc-400 dark:text-zinc-500 text-sm">
              No completed tasks
            </div>
          )}
        </ScrollArea>
      </DroppableColumn>
    </div>
  );

  const renderTableView = () => (
    <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
      <CardContent className="p-0">
        <div className="w-full">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/80">
              <TableRow>
                <TableHead className="w-[40%] sm:w-[35%]">Title</TableHead>
                <TableHead className="w-[20%] sm:w-[15%]">Status</TableHead>
                <TableHead className="hidden sm:table-cell w-[10%]">Points</TableHead>
                <TableHead className="w-[20%] sm:w-[15%]">Assignees</TableHead>
                <TableHead className="hidden md:table-cell w-[15%]">Due Date</TableHead>
                <TableHead className="w-[20%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/70">
                    <TableCell className="font-medium">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="truncate">{task.title}</span>
                        <span className="text-xs text-zinc-500 sm:hidden">
                          {task.points} pts
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "px-2 py-0.5 text-xs whitespace-nowrap",
                        task.status === 'todo' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" :
                        task.status === 'in-progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                        task.status === 'in-review' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" :
                        "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      )}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{task.points}</TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {task.assignees.length > 0 ? (
                          task.assignees.slice(0, 2).map((assignee, index) => (
                            <Avatar key={index} className="h-6 w-6 border-2 border-white dark:border-zinc-800">
                              <AvatarFallback className="text-xs">
                                {assignee.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                        {task.assignees.length > 2 && (
                          <Avatar className="h-6 w-6 border-2 border-white dark:border-zinc-800">
                            <AvatarFallback className="text-xs">+{task.assignees.length - 2}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3" onClick={() => handleEditTask(task)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-red-500 hidden sm:inline-flex" onClick={() => handleDeleteTask(task.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-8 w-8 mb-2 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-zinc-500 dark:text-zinc-400">No tasks found</p>
                      <Button onClick={handleNewTask} variant="outline" size="sm" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Create your first task
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderCalendarView = () => (
    <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-500 dark:text-zinc-400">
          Calendar view is coming soon. This will display tasks based on their due dates.
        </p>
      </CardContent>
    </Card>
  );

  const groupTasksByDate = (tasks: Task[]) => {
    const grouped = tasks.reduce((acc, task) => {
      const date = new Date(task.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return Object.entries(grouped).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  };

  const renderTodoView = () => {
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    const groupedActiveTasks = groupTasksByDate(activeTasks);
    const groupedCompletedTasks = groupTasksByDate(completedTasks);

    return (
      <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
        <CardHeader className="pb-2 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base sm:text-lg">My Tasks</CardTitle>
            <Button onClick={handleNewTask} size="sm" className="h-8 sm:h-9">
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="h-full">
              {activeTasks.length > 0 ? (
                <div>
                  <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Tasks</h3>
                  </div>
                  <div className="px-3 py-3 border-b border-zinc-100 dark:border-zinc-800/50">
                    <QuickTaskForm status="todo" onAdd={handleQuickAddTask} />
                  </div>
                  {groupedActiveTasks.map(([date, dateTasks]) => (
                    <div key={date}>
                      <div className="px-3 py-2 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800/50">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{date}</p>
                      </div>
                      {dateTasks.map(renderTaskListItem)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 text-zinc-500 dark:text-zinc-400">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-zinc-300 dark:text-zinc-600" />
                  <h3 className="text-base sm:text-lg font-medium mb-1">No active tasks</h3>
                  <p className="text-sm">Create a new task to get started.</p>
                  <div className="mt-4 w-full max-w-xs">
                    <QuickTaskForm status="todo" onAdd={handleQuickAddTask} />
                  </div>
                </div>
              )}

              {completedTasks.length > 0 && (
                <div>
                  <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/80 border-y border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Completed Tasks</h3>
                  </div>
                  {groupedCompletedTasks.map(([date, dateTasks]) => (
                    <div key={date}>
                      <div className="px-3 py-2 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800/50">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{date}</p>
                      </div>
                      {dateTasks.map(renderTaskListItem)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-6 overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="w-full overflow-x-auto pb-1">
          <div className="flex space-x-2 border-b border-zinc-200 dark:border-zinc-700 pb-2 min-w-max">
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-md",
                activeView === "todo"
                  ? "bg-white dark:bg-zinc-800 border-b-2 border-primary text-primary"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              )}
              onClick={() => setActiveView("todo")}
            >
              Todo List
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-md",
                activeView === "kanban"
                  ? "bg-white dark:bg-zinc-800 border-b-2 border-primary text-primary"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              )}
              onClick={() => setActiveView("kanban")}
            >
              Kanban
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-md",
                activeView === "table"
                  ? "bg-white dark:bg-zinc-800 border-b-2 border-primary text-primary"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              )}
              onClick={() => setActiveView("table")}
            >
              Table
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-md",
                activeView === "calendar"
                  ? "bg-white dark:bg-zinc-800 border-b-2 border-primary text-primary"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              )}
              onClick={() => setActiveView("calendar")}
            >
              Calendar
            </button>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {activeView !== "todo" && (
            <Button onClick={handleNewTask} className="ml-auto whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 w-full">
        {activeView === "todo" && renderTodoView()}
        {activeView === "kanban" && (
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[900px]">
              <DndProvider backend={HTML5Backend}>
                {renderKanbanView()}
              </DndProvider>
            </div>
          </div>
        )}
        {activeView === "table" && (
          <div className="overflow-x-auto">
            {renderTableView()}
          </div>
        )}
        {activeView === "calendar" && renderCalendarView()}
      </div>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-800/90">
          <DialogHeader>
            <DialogTitle>{taskBeingEdited?.id ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {taskBeingEdited?.id 
                ? 'Edit the details of your task below.' 
                : 'Fill in the details to create a new task.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                name="title"
                value={taskBeingEdited?.title || ''}
                onChange={handleInputChange}
                placeholder="Enter task title"
                className="bg-white dark:bg-zinc-900/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={taskBeingEdited?.description || ''}
                onChange={handleInputChange}
                placeholder="Enter task description"
                rows={3}
                className="bg-white dark:bg-zinc-900/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={taskBeingEdited?.status || 'todo'}
                onChange={handleInputChange}
                className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-zinc-900/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Points</Label>
              <div className="flex space-x-2">
                {[20, 50, 80, 120].map((points) => (
                  <Button
                    key={points}
                    type="button"
                    variant={taskBeingEdited?.points === points ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePointsChange(points)}
                  >
                    {points}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignees">Assignees (comma-separated)</Label>
              <Input
                id="assignees"
                name="assignees"
                value={taskBeingEdited?.assignees?.join(', ') || ''}
                onChange={handleInputChange}
                placeholder="e.g. Alice, Bob, Charlie"
                className="bg-white dark:bg-zinc-900/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={taskBeingEdited?.dueDate?.split('T')[0] || ''}
                onChange={handleInputChange}
                className="bg-white dark:bg-zinc-900/50"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask}>
              {taskBeingEdited?.id ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTask}
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-700 dark:text-zinc-50 dark:hover:bg-red-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskManager; 