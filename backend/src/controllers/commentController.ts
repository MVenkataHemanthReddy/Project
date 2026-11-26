import { Response } from 'express';
import { CommentService } from '../services/commentService';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class CommentController {
  static async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const comment = await CommentService.addComment(
      req.params.id,
      req.user!,
      req.body.content
    );
    sendSuccess(res, 201, comment, 'Comment added successfully');
  }

  static async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    const comments = await CommentService.getComments(req.params.id, req.user!);
    sendSuccess(res, 200, comments);
  }
}
