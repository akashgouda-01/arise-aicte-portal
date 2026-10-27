import { Router, Request, Response } from 'express';
import { mockTasks } from '../data/mockData';
import { PortalTask, UserRole, TaskStatus } from '../models/types';
import { AuditService } from '../services/auditService';

export const taskRouter = Router();

let tasks: PortalTask[] = [...mockTasks];

// GET all tasks with filtering
taskRouter.get('/', (req: Request, res: Response) => {
  const { role, assignedTo, applicationId, status, taskType } = req.query;
  let result = [...tasks];

  if (role) {
    result = result.filter(
      (t) => t.assignedRole === role || (role === 'PROCESSING_OFFICER' && t.assignedRole === 'PROCESSING_OFFICER')
    );
  }
  if (assignedTo) {
    result = result.filter((t) => t.assignedToName?.toLowerCase().includes(String(assignedTo).toLowerCase()));
  }
  if (applicationId) {
    result = result.filter((t) => t.applicationId === applicationId);
  }
  if (status) {
    result = result.filter((t) => t.status === status);
  }
  if (taskType) {
    result = result.filter((t) => t.taskType === taskType);
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// POST create task
taskRouter.post('/', (req: Request, res: Response) => {
  const taskData: Partial<PortalTask> = req.body;
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  const newTask: PortalTask = {
    id: `task_${Date.now()}`,
    taskType: taskData.taskType || 'EVIDENCE_VERIFICATION',
    title: taskData.title || 'Operational Task',
    applicationId: taskData.applicationId,
    applicationNumber: taskData.applicationNumber,
    institutionId: taskData.institutionId,
    institutionName: taskData.institutionName,
    category: taskData.category,
    currentStage: taskData.currentStage,
    requirementId: taskData.requirementId,
    requirementCode: taskData.requirementCode,
    relatedPolicyId: taskData.relatedPolicyId,
    policyVersion: taskData.policyVersion,
    assignedRole: taskData.assignedRole || 'PROCESSING_OFFICER',
    assignedToName: taskData.assignedToName,
    status: 'PENDING',
    priority: taskData.priority || 'MEDIUM',
    dueDate: taskData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    isOverdue: false,
    createdAt: timestamp,
    sourceEvent: taskData.sourceEvent || 'System event triggered workflow task',
    allowedActions: taskData.allowedActions || ['VERIFY', 'REVIEW'],
    targetSection: taskData.targetSection || 'compliance-evidence',
  };

  tasks.unshift(newTask);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: newTask,
  });
});

// POST resolve task
taskRouter.post('/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolvedBy, actorRole, resolutionReason, status } = req.body;

  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const current = tasks[idx];
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  const updated: PortalTask = {
    ...current,
    status: (status as TaskStatus) || 'COMPLETED',
    completedAt: timestamp,
    resolutionReason: resolutionReason || 'Task completed and verified by authorized officer.',
  };

  tasks[idx] = updated;

  AuditService.logEvent({
    actorId: actorRole || 'officer',
    actorName: resolvedBy || 'Authorized Officer',
    actorRole: (actorRole as UserRole) || current.assignedRole,
    action: 'TASK_RESOLVED',
    entityType: 'APPLICATION',
    entityId: current.applicationId || current.id,
    entityName: current.title,
    details: `Task '${current.title}' resolved with status '${updated.status}'. Reason: ${updated.resolutionReason}`,
  });

  res.json({
    success: true,
    message: 'Task marked as resolved',
    data: updated,
  });
});

// Helper for other routes to add tasks programmatically
export function createTaskInternal(task: Omit<PortalTask, 'id' | 'createdAt'>): PortalTask {
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;
  const newTask: PortalTask = {
    ...task,
    id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: timestamp,
  };
  tasks.unshift(newTask);
  return newTask;
}
