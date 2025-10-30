// ========================================
// PROJECT CONTROLLER
// ========================================

import express from 'express';
import Project from '../models/ProjectSchema.js';
import Task from '../models/TaskSchema.js';

const router = express.Router();

// ======================
// 🔹 PROJECTS ROUTES
// ======================

// CREATE: Crear un nuevo proyecto
router.post('/', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    await project.populate('owner teamMembers.user');
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// LIST: Listar proyectos con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      owner,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      client
    } = req.query;

    // Construir filtros
    const filters = {};
    
    if (status) filters.status = status;
    if (owner) filters.owner = owner;
    if (client) filters.client = new RegExp(client, 'i');
    
    // Búsqueda de texto completo
    if (search) {
      filters.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { client: new RegExp(search, 'i') }
      ];
    }

    // Calcular skip
    const skip = (page - 1) * limit;

    // Ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query
    const projects = await Project.find(filters)
      .populate('owner', 'name')
      .populate('teamMembers.user', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(filters);

    res.json({
      success: true,
      data: projects,
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

// READ: Obtener un proyecto por ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name')
      .populate('teamMembers.user', 'name');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE: Actualizar un proyecto
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name')
      .populate('teamMembers.user', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE: Eliminar un proyecto
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    // Eliminar todas las tareas asociadas
    await Task.deleteMany({ project: req.params.id });

    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener progreso del proyecto
router.get('/:id/progress', async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id });
    
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      progress: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
        : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Exportar el router
export default router;