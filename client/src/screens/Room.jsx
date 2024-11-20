import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
} from "@mui/material";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    const existingTracks = peer.peer.getSenders().map((sender) => sender.track);

    for (const track of myStream.getTracks()) {
      if (!existingTracks.includes(track)) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream, peer.peer]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleEndCall = useCallback(() => {
    // Stop all tracks in the user's media stream
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }
  
    // Redirect to the home or goodbye page
    window.location.href = "/";
  }, [myStream]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(90deg, #2196F3, #21CBF3)",
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          style={{ padding: "2rem", backgroundColor: "rgba(255, 255, 255, 0.95)" }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Room Page
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            gutterBottom
            style={{ color: remoteSocketId ? "green" : "red" }}
          >
            {remoteSocketId ? "Connected to a user" : "No one in the room"}
          </Typography>

          <Grid container spacing={3} justifyContent="center" style={{ marginBottom: "1rem" }}>
            {myStream && (
              <Grid item>
                <Button variant="contained" color="primary" onClick={sendStreams}>
                  Send Stream
                </Button>
              </Grid>
            )}
            {remoteSocketId && (
              <Grid item>
                <Button variant="contained" color="secondary" onClick={handleCallUser}>
                  Call
                </Button>
              </Grid>
            )}
            {myStream && (
              <Grid item>
                <Button variant="contained" color="error" onClick={handleEndCall}>
                  End Call
                </Button>
              </Grid>
            )}
          </Grid>

          <Divider style={{ margin: "1rem 0" }} />

          <Grid container spacing={4}>
            {myStream && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" align="center">
                  My Stream
                </Typography>
                <ReactPlayer
                  playing
                  muted
                  height="200px"
                  width="100%"
                  url={myStream}
                  style={{ border: "1px solid #ddd", borderRadius: "8px" }}
                />
              </Grid>
            )}
            {remoteStream && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" align="center">
                  Remote Stream
                </Typography>
                <ReactPlayer
                  playing
                  muted
                  height="200px"
                  width="100%"
                  url={remoteStream}
                  style={{ border: "1px solid #ddd", borderRadius: "8px" }}
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default RoomPage;
