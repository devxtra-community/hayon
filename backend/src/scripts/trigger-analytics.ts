import connectDB from "../config/database";
import { connectRabbitMQ } from "../config/rabbitmq";
import { AnalyticsCronService } from "../services/cron/analytics.cron";
import mongoose from "mongoose";

async function run() {
  console.log("🚀 Starting manual analytics trigger...");

  try {
    // 1. Connect to Database
    await connectDB();
    console.log("✅ Database connected.");

    // 2. Connect to RabbitMQ
    await connectRabbitMQ();
    console.log("✅ RabbitMQ connected.");

    // 3. Trigger Post Analytics
    console.log("🔄 Triggering post analytics updates...");
    await AnalyticsCronService.schedulePostAnalyticsTasks();

    // 4. Trigger Account Analytics (Followers)
    console.log("🔄 Triggering account analytics updates...");
    await AnalyticsCronService.scheduleAccountAnalyticsTasks();

    console.log("✨ All analytics tasks have been queued successfully!");
    console.log("💡 Make sure your worker is running (`npm run worker`) to process these tasks.");
  } catch (error) {
    console.error("❌ Error triggering analytics:", error);
  } finally {
    // Give some time for messages to be sent before closing
    setTimeout(async () => {
      await mongoose.connection.close();
      console.log("🔌 Database connection closed.");
      process.exit(0);
    }, 2000);
  }
}

run();
