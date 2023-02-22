import Document from "../schema/documentSchema.js";
//get the document from the database
export const getDocument = async (id) => {
  if (id === null) return;

  const document = await Document.findById(id);

  if (document) return document;

  return await Document.create({ _id: id, data: "" });
};
//update the document from tha database
export const updateDocument = async (id, data) => {
  return await Document.findByIdAndUpdate(id, { data });
};
