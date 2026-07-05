const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get active checklist tasks (public for Station Masters)
exports.getTasks = async (req, res) => {
  try {
    const tasks = await prisma.checklistTask.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist tasks' });
  }
};

// Admin: Get all tasks (including inactive)
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.checklistTask.findMany({
      orderBy: [
        { procedureType: 'asc' },
        { sortOrder: 'asc' }
      ],
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Admin: Create task
exports.createTask = async (req, res) => {
  try {
    const { text, procedureType, sortOrder, controlType, options } = req.body;
    const task = await prisma.checklistTask.create({
      data: {
        text,
        procedureType,
        sortOrder: sortOrder || 0,
        controlType: controlType || 'checkbox',
        options: options ? JSON.stringify(options) : null
      }
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Admin: Update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, procedureType, sortOrder, isActive, controlType, options } = req.body;
    const task = await prisma.checklistTask.update({
      where: { id },
      data: {
        text,
        procedureType,
        sortOrder,
        isActive,
        controlType,
        options: options ? JSON.stringify(options) : null
      }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Admin: Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.checklistTask.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

// Submit a completed checklist
exports.submitChecklist = async (req, res) => {
  try {
    const { stationId, procedureType, shiftDate, isCompliant, items } = req.body;
    const userId = req.user.id;

    const submission = await prisma.checklistSubmission.create({
      data: {
        userId,
        stationId,
        procedureType,
        isCompliant: isCompliant !== undefined ? isCompliant : true,
        shiftDate: shiftDate || new Date().toISOString().slice(0, 10),
        items: {
          create: items.map(item => ({
            taskId: item.taskId,
            taskText: item.taskText,
            controlType: item.controlType || 'checkbox',
            value: String(item.value)
          }))
        }
      },
      include: {
        items: true,
        station: true,
        user: true
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit checklist' });
  }
};

// Admin: Get all submission logs
exports.getLogs = async (req, res) => {
  try {
    const logs = await prisma.checklistSubmission.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        station: { select: { id: true, name: true, stationCode: true, lineCode: true } },
        items: true
      }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist logs' });
  }
};
