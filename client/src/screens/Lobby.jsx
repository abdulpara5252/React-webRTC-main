import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Container,
} from "@mui/material";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)),
          url('/undraw_software_engineer_lvl5.svg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} style={{ padding: "2rem", backgroundColor: "rgba(255, 255, 255, 0.85)" }}>
          <Typography variant="h4" align="center" gutterBottom>
            Join a Room
          </Typography>
          <form onSubmit={handleSubmitForm}>
            <Box mb={3}>
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Box>
            <Box mb={3}>
              <TextField
                label="Room Number"
                type="text"
                variant="outlined"
                fullWidth
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </Box>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button type="submit" variant="contained" color="primary">
                  Join Room
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default LobbyScreen;
