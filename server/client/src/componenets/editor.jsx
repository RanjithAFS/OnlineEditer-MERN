import { Box } from "@mui/material";
import "../App.css";
import { useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import styled from "@emotion/styled";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
const Component = styled.div`
  background: #f5f5f5;
`;
const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];
const Editor = () => {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  //to use the parameters,proprties of this id
  const { id } = useParams();

  //making a api call to Quill.js or creating a Quill object
  useEffect(() => {
    const quillServer = new Quill("#container", {
      theme: "snow",
      modules: {
        toolbar: toolbarOptions,
      },
    });
    quillServer.disable();
    quillServer.setText("Loading the document...");
    setQuill(quillServer);
  }, []);
  //http://localhost:9000
  //connection the client to backend server of web socket
  useEffect(() => {
    const socketServer = io("");
    setSocket(socketServer);
    //diconnecting the socket server when component is unmounted
    return () => {
      socketServer.disconnect();
    };
  }, []);
  useEffect(() => {
    //if socket id is null or no othere socket connection or
    //quill is null then do not send socket changes or quil changes
    if (socket === null || quill === null) return;
    const handleChange = (delta, oldData, source) => {
      if (source !== "user") return;
      //send changes to server
      socket.emit("send-changes", delta);
    };
    quill && quill.on("text-change", handleChange);
    //while unmounting turing off the quill connection
    return () => {
      quill && quill.off("text-change", handleChange);
    };
  }, [quill, socket]);
  //reciving the changes from other clients from  the server
  useEffect(() => {
    if (socket === null || quill == null) return;
    const handleChange = (delta) => {
      quill.updateContents(delta);
    };
    //tacking the event from the serever i.e all changes
    socket && socket.on("receive-changes", handleChange);
    return () => {
      socket && socket.off("receive-changes", handleChange);
    };
  }, [quill, socket]);
  //loading/sending the content of the paritcular id
  useEffect(() => {
    if (quill === null || socket === null) return;

    //sending the id to the server to get the document
    socket && socket.emit("get-document", id);
    socket &&
      //once the document is loaded set the contents to Quill
      socket.once("load-document", (document) => {
        quill.setContents(document);
        quill.enable();
      });
  }, [quill, socket, id]);
  useEffect(() => {
    if (socket === null || quill === null) return;
    //save document after every 2 seconds
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);
    //when the component is unmounted then clear the connection
    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);
  return (
    <Component>
      <Box className="container" id="container"></Box>
    </Component>
  );
};
export default Editor;
