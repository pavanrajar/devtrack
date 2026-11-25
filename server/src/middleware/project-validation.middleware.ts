
import validate from './validate.middleware'
import { createProjectSchema } from '../validators/project.validator'

export const validateCreateProject = validate(createProjectSchema)
    