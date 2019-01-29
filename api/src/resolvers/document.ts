import { DocumentModel } from '../models/document';
import { ObjectId } from 'bson';
import { ExerciseModel } from '../models/exercise';
import { UploadModel } from '../models/upload';
import uploadResolver from './upload';

const documentResolver = {
  Mutation: {
    createDocument: async (root: any, args: any, context: any) => {
      const documentNew = new DocumentModel({
        id: ObjectId,
        user: context.user.userID,
        title: args.input.title,
        type: args.input.type,
        content: args.input.content,
        description: args.input.description,
        version: args.input.version,
      });
      const newDocument = await DocumentModel.create(documentNew);

      if (args.input.image) {
        const imageUploaded = await uploadResolver.Mutation.singleUpload(
          args.input.image,
          newDocument._id,
        );
        return DocumentModel.findOneAndUpdate(
          { _id: documentNew },
          { $set: { image: imageUploaded.publicURL } },
          { new: true },
        );
      } else {
        return newDocument;
      }
    },

    deleteDocument: async (root: any, args: any, context: any) => {
      const existDocument = await DocumentModel.findOne({
        _id: args.id,
        user: context.user.userID,
      });
      if (existDocument) {
        return DocumentModel.deleteOne({ _id: args.id });
      } else {
        throw new Error('You only can delete your documents');
      }
    },

    updateDocument: async (root: any, args: any, context: any) => {
      const existDocument = await DocumentModel.findOne({
        _id: args.id,
        user: context.user.userID,
      });

      if (existDocument) {
        if (args.input.image) {
          const imageUploaded = await uploadResolver.Mutation.singleUpload(
            args.input.image,
            existDocument._id,
          );
          const documentUpdate = {
            title: args.input.title || existDocument.title,
            type: args.input.type || existDocument.type,
            content: args.input.content || existDocument.content,
            description: args.input.description || existDocument.description,
            version: args.input.version || existDocument.version,
            image: imageUploaded.publicURL,
          };
          return DocumentModel.findOneAndUpdate(
            { _id: existDocument._id },
            { $set: documentUpdate },
            { new: true },
          );
        } else {
          return DocumentModel.findOneAndUpdate(
            { _id: existDocument._id },
            { $set: args.input },
            { new: true },
          );
        }
      } else {
        return new Error('Document does not exist');
      }
    },
  },
  Query: {
    documents: async (root: any, args: any, context: any) => {
      return DocumentModel.find({ user: context.user.userID });
    },
    document: async (root: any, args: any, context: any) => {
      const doc = await DocumentModel.findOne({
        _id: args.id,
      });
      if (!doc) {
        throw new Error('Document does not exist');
      }
      if (doc.user != context.user.userID) {
        throw new Error('This ID does not belong to one of your documents');
      }
      return doc;
    },
  },
  Document: {
    exercises: async document => ExerciseModel.find({ document: document._id }),
    images: async document => UploadModel.find({ document: document._id }),
  },
};

export default documentResolver;
