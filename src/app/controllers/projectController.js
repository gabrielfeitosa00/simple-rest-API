const express = require ('express');

const authMiddleware= require ('../middleware/auth');

const Project= require('../models/Project');
const Task=require('../models/Task');

const router = express.Router();

router.use(authMiddleware);


// lists all projects
router.get('/', async (req,res) => {
    try {
        const projects = await Project.find().populate(['user', 'tasks']);

        return res.send({projects});
        
    } 
    
    
    catch (err) {
        console.log(err);
        return res.status(400).send({error: 'Error loading projects'});
    }
});

// show only one project
router.get('/:projectId', async (req,res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);

        return res.send({project});
        
    } 
    
    
    catch (err) {
        console.log(err);
        return res.status(400).send({error: 'Error loading project'});
    }
});

// create a new project
router.post('/', async (req,res) => {

    try {

        const {title,description,tasks}=req.body;

        const project = await Project.create({title,description, user:req.userId});

        await Promise.all( tasks.map( async task => {
            const projectTask= new Task ({...task, project: project._id});

            await projectTask.save();
            
            project.tasks.push(projectTask);
        }));

        await project.save();

        return res.send({project});
        
    } 
    
    catch (err) {
        
        return res.status(400).send({error: 'Error creating new project'});
    }

    
});

// update an existing project
router.put('/:projectId', async (req,res) => {
    try {

        const {title,description,tasks}=req.body;

        const project = await Project.findByIdAndUpdate(req.params.projectId,
            {title,
            description
            },{new:true});

        project.tasks=[];
        await Task.deleteMany({project:project._id});

        await Promise.all( tasks.map( async task => {
            const projectTask= new Task ({...task, project: project._id});

            await projectTask.save();
            
            project.tasks.push(projectTask);
        }));

        await project.save();

        return res.send({project});
        
    } 
    
    catch (err) {
        console.log(errorMonitor)
        return res.status(400).send({error: 'Error updating project'});
    }
});

// deletes a project
router.delete('/:projectId', async (req,res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.projectId);

        return res.send();
        
    } 
    
    
    catch (err) {
        console.log(err);
        return res.status(400).send({error: 'Error deleting project'});
    }
});




module.exports= app => app.use('/projects', router);