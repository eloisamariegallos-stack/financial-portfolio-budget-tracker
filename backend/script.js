
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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
  res.json({ status: "ok" });
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
  ["/api/income", "/api/expenses", "/api/portfolio"],
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
  const { source, amount, description, income_date } = req.body;

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
  const { category, amount, description, expense_date } = req.body;

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
      ...(expense_date ? { expense_date } : {}),
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

app.get("/api/transactions", (req, res) => {
  res.json({ success: true, transactions: [] });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
