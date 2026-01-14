import express from "express"
import { ENV } from "./config/env.config"
import blueskyRoutes from "./routes/bluesky.routes"
import mastodonRoutes from "./routes/mastodon.routes"
import threadsRoutes from "./routes/threads.routes"
import tumblrRoutes from "./routes/tumblr.routes"
import morgan from "morgan"
const app = express();


app.use(morgan("dev"));
app.use(express.json());
app.use("/bluesky", blueskyRoutes);
app.use("/mastodon", mastodonRoutes);
app.use("/threads", threadsRoutes);
app.use("/tumblr", tumblrRoutes);

app.get("/health", (req, res) => {
    res.send("Hello, World!");
});





app.listen(ENV.APP.PORT, () => {
    console.log(`Server is running on port ${ENV.APP.PORT}`);
});
