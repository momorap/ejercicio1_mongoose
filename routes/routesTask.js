import express from 'express';
const router = express.Router();
import Task from "../models/TaskSchema.js";
// ========================================
// TASK CONTROLLER
// ========================================

router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    await task.populate('project assignedTo dependencies');
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// LIST: Listar tareas con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      project,
      assignedTo,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tags,
      overdue
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (project) filters.project = project;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (tags) filters.tags = { $in: tags.split(',') };
    
    // Filtrar tareas vencidas
    if (overdue === 'true') {
      filters.dueDate = { $lt: new Date() };
      filters.status = { $ne: 'completed' };
    }
    
    // Búsqueda de texto completo
    if (search) {
      filters.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Calcular skip
    const skip = (page - 1) * limit;

    // Ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query
    const tasks = await Task.find(filters)
      .populate('project', 'name status')
      .populate('assignedTo', 'name')
      .populate('dependencies', 'title status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filters);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// READ: Obtener una tarea por ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status')
      .populate('assignedTo', 'name')
      .populate('dependencies', 'title status');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE: Actualizar una tarea
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('project', 'name status')
      .populate('assignedTo', 'name')
      .populate('dependencies', 'title status');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE: Eliminar una tarea
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    // Remover de dependencias de otras tareas
    await Task.updateMany(
      { dependencies: req.params.id },
      { $pull: { dependencies: req.params.id } }
    );

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Agregar adjunto a una tarea
router.post('/:id/attachments', async (req, res) => {
  try {
    const { filename, url } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          attachments: { filename, url }
        }
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;