const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.FRONTEND_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: "This frontend origin is not allowed by CORS.",
    });
  }
  next();
});

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Basic backend routes
app.get("/", (req, res) => {
  res.send("Finance Tracker backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", supabaseConfigured: Boolean(supabase) });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "React and Express are communicating!",
    app: "Financial Portfolio & Budget Tracker",
  });
});

// Make sure Supabase is configured before using database routes.
app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path === "/test") {
    return next();
  }

  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: "Supabase environment variables are missing.",
    });
  }

  next();
});

// Sign up
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message:
          "Username must contain only letters, numbers, and underscores, with no spaces.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username,
          full_name: full_name || "",
        },
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: data.session
        ? "Registration successful."
        : "Registration received. Check your email if confirmation is required.",
      user: data.user
        ? { id: data.user.id, email: data.user.email }
        : null,
      requiresEmailConfirmation: !data.session,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected signup error occurred.",
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected login error occurred.",
    });
  }
});

// Authentication middleware for protected endpoints
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please provide an access token.",
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token. Please log in again.",
      });
    }

    req.user = data.user;
    req.db = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Authentication failed unexpectedly.",
    });
  }
}

app.use(
  [
    "/api/income",
    "/api/expenses",
    "/api/portfolio",
    "/api/goals",
    "/api/budgets",
    "/api/notifications",
  ],
  authenticate
);

// Income records
app.get("/api/income", async (req, res) => {
  const { data, error } = await req.db
    .from("income")
    .select("*")
    .eq("user_id", req.user.id)
    .order("income_date", { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.json({ success: true, income: data });
});

app.post("/api/income", async (req, res) => {
  const { source, amount, description, income_date, occurred_at } = req.body;

  if (!source || amount === undefined ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "A source and a positive numeric amount are required.",
    });
  }

  const { data, error } = await req.db
    .from("income")
    .insert({
      user_id: req.user.id,
      source,
      amount: Number(amount),
      description: description || null,
      ...(income_date ? { income_date } : {}),
      ...(occurred_at && !Number.isNaN(Date.parse(occurred_at)) ? { occurred_at } : {}),
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(201).json({ success: true, income: data });
});

app.put("/api/income/:id", async (req, res) => {
  const { source, amount, description, income_date, occurred_at } = req.body;

  if (!source || amount === undefined ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "A source and a positive numeric amount are required.",
    });
  }

  const { data, error } = await req.db
    .from("income")
    .update({
      source,
      amount: Number(amount),
      description: description || null,
      ...(income_date ? { income_date } : {}),
      ...(occurred_at && !Number.isNaN(Date.parse(occurred_at)) ? { occurred_at } : {}),
    })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Income record not found." });
  }
  return res.json({ success: true, income: data });
});

app.delete("/api/income/:id", async (req, res) => {
  const { data, error } = await req.db
    .from("income")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Income record not found." });
  }
  return res.json({ success: true, income: data });
});

// Expense records
app.get("/api/expenses", async (req, res) => {
  const { data, error } = await req.db
    .from("expenses")
    .select("*")
    .eq("user_id", req.user.id)
    .order("expense_date", { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.json({ success: true, expenses: data });
});

app.post("/api/expenses", async (req, res) => {
  const { category, amount, description, expense_date, expense_time, occurred_at, method } = req.body;

  if (!category || amount === undefined ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "A category and a positive numeric amount are required.",
    });
  }

  const { data, error } = await req.db
    .from("expenses")
    .insert({
      user_id: req.user.id,
      category,
      amount: Number(amount),
      description: description || null,
      payment_method: typeof method === "string" && method.trim() ? method.trim() : "Cash",
      ...(expense_time ? { expense_time } : {}),
      ...(expense_date ? { expense_date } : {}),
      ...(occurred_at && !Number.isNaN(Date.parse(occurred_at)) ? { occurred_at } : {}),
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(201).json({ success: true, expense: data });
});

app.put("/api/expenses/:id", async (req, res) => {
  const { category, amount, description, expense_date, expense_time, occurred_at, method } = req.body;

  if (!category || amount === undefined ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "A category and a positive numeric amount are required.",
    });
  }

  const { data, error } = await req.db
    .from("expenses")
    .update({
      category,
      amount: Number(amount),
      description: description || null,
      payment_method: typeof method === "string" && method.trim() ? method.trim() : "Cash",
      ...(expense_time ? { expense_time } : {}),
      ...(expense_date ? { expense_date } : {}),
      ...(occurred_at && !Number.isNaN(Date.parse(occurred_at)) ? { occurred_at } : {}),
    })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Expense record not found." });
  }
  return res.json({ success: true, expense: data });
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { data, error } = await req.db
    .from("expenses")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Expense record not found." });
  }
  return res.json({ success: true, expense: data });
});

app.get("/api/portfolio", async (req, res) => {
  const { data, error } = await req.db
    .from("portfolio")
    .select("*")
    .eq("user_id", req.user.id)
    .order("id", { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.json({ success: true, portfolio: data });
});

app.post("/api/portfolio", async (req, res) => {
  const { asset_name, asset_type, quantity, purchase_price } = req.body;

  if (!asset_name || !asset_type ||
      quantity === undefined || purchase_price === undefined ||
      !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 ||
      !Number.isFinite(Number(purchase_price)) || Number(purchase_price) < 0) {
    return res.status(400).json({
      success: false,
      message:
        "Asset name, asset type, positive quantity, and a non-negative purchase price are required.",
    });
  }

  const { data, error } = await req.db
    .from("portfolio")
    .insert({
      user_id: req.user.id,
      asset_name,
      asset_type,
      quantity: Number(quantity),
      purchase_price: Number(purchase_price),
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

  return res.status(201).json({ success: true, portfolio: data });
});

app.put("/api/portfolio/:id", async (req, res) => {
  const { asset_name, asset_type, quantity, purchase_price } = req.body;

  if (!asset_name || !asset_type ||
      quantity === undefined || purchase_price === undefined ||
      !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 ||
      !Number.isFinite(Number(purchase_price)) || Number(purchase_price) < 0) {
    return res.status(400).json({
      success: false,
      message:
        "Asset name, asset type, positive quantity, and a non-negative purchase price are required.",
    });
  }

  const { data, error } = await req.db
    .from("portfolio")
    .update({
      asset_name,
      asset_type,
      quantity: Number(quantity),
      purchase_price: Number(purchase_price),
    })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Portfolio record not found." });
  }
  return res.json({ success: true, portfolio: data });
});

app.delete("/api/portfolio/:id", async (req, res) => {
  const { data, error } = await req.db
    .from("portfolio")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Portfolio record not found." });
  }
  return res.json({ success: true, portfolio: data });
});

// Savings goals
function parseGoalBody(body) {
  const { title, target_amount, current_amount, target_date } = body || {};
  const target = Number(target_amount);
  const current = current_amount === undefined ? 0 : Number(current_amount);

  if (typeof title !== "string" || !title.trim()) {
    return { error: "A goal name is required." };
  }
  if (!Number.isFinite(target) || target <= 0) {
    return { error: "A positive target amount is required." };
  }
  if (!Number.isFinite(current) || current < 0) {
    return { error: "Current savings must be zero or more." };
  }
  return {
    values: {
      title: title.trim(),
      target_amount: target,
      current_amount: current,
      target_date: target_date || null,
    },
  };
}

const validId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

async function withContributions(db, goals) {
  if (!goals.length) return [];
  const { data, error } = await db
    .from("goal_contributions")
    .select("*")
    .in("goal_id", goals.map((g) => g.id))
    .order("id", { ascending: true });
  if (error) throw error;
  return goals.map((g) => ({
    ...g,
    contributions: data.filter((c) => c.goal_id === g.id),
  }));
}

app.get("/api/goals", async (req, res) => {
  try {
    const { data, error } = await req.db
      .from("financial_goals")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.json({ success: true, goals: await withContributions(req.db, data) });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/api/goals", async (req, res) => {
  const { error: invalid, values } = parseGoalBody(req.body);
  if (invalid) return res.status(400).json({ success: false, message: invalid });

  const { data, error } = await req.db
    .from("financial_goals")
    .insert({ user_id: req.user.id, ...values })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, goal: { ...data, contributions: [] } });
});

app.put("/api/goals/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid goal id." });
  }
  const { error: invalid, values } = parseGoalBody(req.body);
  if (invalid) return res.status(400).json({ success: false, message: invalid });

  try {
    const { data, error } = await req.db
      .from("financial_goals")
      .update(values)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (!data) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }
    const [goal] = await withContributions(req.db, [data]);
    return res.json({ success: true, goal });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/api/goals/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid goal id." });
  }
  const { data, error } = await req.db
    .from("financial_goals")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Goal not found." });
  }
  return res.json({ success: true, goal: data });
});

app.post("/api/goals/:id/contributions", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid goal id." });
  }
  const { direction, amount } = req.body || {};
  if (!["add", "withdraw"].includes(direction) ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: "A direction (add or withdraw) and a positive amount are required.",
    });
  }

  try {
    const { data, error } = await req.db.rpc("add_goal_contribution", {
      p_goal_id: Number(req.params.id),
      p_direction: direction,
      p_amount: Number(amount),
    });
    if (error) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
    const [goal] = await withContributions(req.db, [data]);
    return res.status(201).json({ success: true, goal });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Budgets
function parseBudgetBody(body) {
  const { category_name, monthly_limit, month } = body || {};
  const limit = Number(monthly_limit);

  if (typeof category_name !== "string" || !category_name.trim()) {
    return { error: "A budget category is required." };
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    return { error: "A positive budget limit is required." };
  }
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { error: "Month must be in YYYY-MM format." };
  }
  return {
    values: {
      category_name: category_name.trim(),
      monthly_limit: limit,
      month: `${month}-01`,
    },
  };
}

function budgetError(res, error) {
  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A budget for this category and month already exists.",
    });
  }
  return res.status(400).json({ success: false, message: error.message });
}

app.get("/api/budgets", async (req, res) => {
  const { data, error } = await req.db
    .from("budget_categories")
    .select("*")
    .eq("user_id", req.user.id)
    .order("month", { ascending: false })
    .order("id", { ascending: false });

  if (error) return budgetError(res, error);
  return res.json({ success: true, budgets: data });
});

app.post("/api/budgets", async (req, res) => {
  const { error: invalid, values } = parseBudgetBody(req.body);
  if (invalid) return res.status(400).json({ success: false, message: invalid });

  const { data, error } = await req.db
    .from("budget_categories")
    .insert({ user_id: req.user.id, ...values })
    .select()
    .single();

  if (error) return budgetError(res, error);
  return res.status(201).json({ success: true, budget: data });
});

app.put("/api/budgets/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid budget id." });
  }
  const { error: invalid, values } = parseBudgetBody(req.body);
  if (invalid) return res.status(400).json({ success: false, message: invalid });

  const { data, error } = await req.db
    .from("budget_categories")
    .update(values)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();

  if (error) return budgetError(res, error);
  if (!data) {
    return res.status(404).json({ success: false, message: "Budget not found." });
  }
  return res.json({ success: true, budget: data });
});

app.delete("/api/budgets/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid budget id." });
  }
  const { data, error } = await req.db
    .from("budget_categories")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("id")
    .maybeSingle();

  if (error) return budgetError(res, error);
  if (!data) {
    return res.status(404).json({ success: false, message: "Budget not found." });
  }
  return res.json({ success: true, budget: data });
});

// Notifications
// Budget alerts are created by the database trigger (check_budget_alert).
// These routes let the app read them, mark them as read, add reminders and delete them.
app.get("/api/notifications", async (req, res) => {
  const { data, error } = await req.db
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.json({ success: true, notifications: data });
});

app.post("/api/notifications", async (req, res) => {
  const { message } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "A reminder message is required.",
    });
  }

  const { data, error } = await req.db
    .from("notifications")
    .insert({
      user_id: req.user.id,
      type: "reminder",
      message: message.trim().slice(0, 500),
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, notification: data });
});

// Must stay before the "/:id" routes so "read-all" is not read as an id.
app.put("/api/notifications/read-all", async (req, res) => {
  const { data, error } = await req.db
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", req.user.id)
    .eq("is_read", false)
    .select("id");

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.json({ success: true, updated: data.length });
});

app.put("/api/notifications/:id/read", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid notification id." });
  }

  const { data, error } = await req.db
    .from("notifications")
    .update({ is_read: true })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }
  return res.json({ success: true, notification: data });
});

app.delete("/api/notifications/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid notification id." });
  }

  const { data, error } = await req.db
    .from("notifications")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (!data) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }
  return res.json({ success: true, notification: data });
});

app.get("/api/transactions", (req, res) => {
  res.json({ success: true, transactions: [] });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Request body must contain valid JSON.",
    });
  }

  console.error("Unhandled request error:", error);
  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});