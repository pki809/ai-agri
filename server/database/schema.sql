-- AgriSupply Insights Database Schema
-- Created for comprehensive agricultural supply chain management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('farmer', 'supplier', 'admin', 'cooperative_manager');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_type AS ENUM ('price_change', 'supply_shortage', 'high_demand', 'weather', 'market_update');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE supply_category AS ENUM ('fertilizers', 'seeds', 'pesticides', 'equipment', 'feed', 'other');
CREATE TYPE trend_direction AS ENUM ('upward', 'downward', 'stable');

-- Users table (farmers, suppliers, admins, etc.)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'farmer',
    
    -- Farm/Business specific information
    farm_name VARCHAR(255),
    farm_size DECIMAL(10,2), -- in acres
    primary_crops TEXT[], -- array of crop types
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Preferences
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    in_app_notifications BOOLEAN DEFAULT true,
    
    -- Account status
    email_verified BOOLEAN DEFAULT false,
    account_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Business information
    business_license VARCHAR(100),
    tax_id VARCHAR(50),
    website VARCHAR(255),
    
    -- Rating and reliability
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Status
    active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplies/Products table
CREATE TABLE supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    
    -- Product information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category supply_category NOT NULL,
    sku VARCHAR(100) UNIQUE,
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- e.g., 'lb', 'bag', 'gallon'
    bulk_discount_threshold INTEGER,
    bulk_discount_percentage DECIMAL(5,2),
    
    -- Inventory
    current_inventory INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 0,
    maximum_stock_level INTEGER,
    reorder_point INTEGER,
    
    -- Product specifications
    weight DECIMAL(10,2),
    dimensions VARCHAR(100), -- e.g., '12x8x6 inches'
    shelf_life_days INTEGER,
    storage_requirements TEXT,
    
    -- Certification and compliance
    organic_certified BOOLEAN DEFAULT false,
    certifications TEXT[], -- array of certification names
    
    -- Status
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table (can be farms, cooperatives, etc.)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Customer information
    customer_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'cooperative', 'corporate'
    business_name VARCHAR(255),
    
    -- Purchase behavior
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    average_order_value DECIMAL(10,2) DEFAULT 0.00,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    purchase_frequency_days INTEGER, -- average days between purchases
    
    -- Preferred categories and products
    preferred_categories supply_category[],
    preferred_suppliers UUID[],
    
    -- Credit information
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 30, -- days
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    
    -- Order information
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    shipping_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Dates
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_delivery_date DATE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Shipping information
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_zip VARCHAR(20),
    tracking_number VARCHAR(100),
    
    -- Payment information
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    supply_id UUID REFERENCES supplies(id) ON DELETE CASCADE,
    
    -- Item details
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market trends table
CREATE TABLE market_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Commodity information
    commodity_name VARCHAR(255) NOT NULL,
    category supply_category,
    
    -- Price information
    current_price DECIMAL(10,2) NOT NULL,
    previous_price DECIMAL(10,2),
    price_change DECIMAL(10,2),
    price_change_percentage DECIMAL(5,2),
    
    -- Trend analysis
    trend_direction trend_direction,
    volatility_score DECIMAL(3,2), -- 0-1 scale
    
    -- Forecasting
    forecast_price DECIMAL(10,2),
    forecast_confidence DECIMAL(3,2), -- 0-1 scale
    forecast_period_days INTEGER DEFAULT 30,
    
    -- Market data
    trading_volume BIGINT,
    market_cap DECIMAL(15,2),
    
    -- External factors
    weather_impact_score DECIMAL(3,2), -- 0-1 scale
    seasonal_factor DECIMAL(3,2), -- 0-2 scale (1 = normal)
    supply_demand_ratio DECIMAL(5,2),
    
    -- Geographic information
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Data source
    data_source VARCHAR(100),
    data_quality_score DECIMAL(3,2), -- 0-1 scale
    
    -- Metadata
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Alert information
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type alert_type NOT NULL,
    severity alert_severity DEFAULT 'medium',
    
    -- Related entities
    supply_id UUID REFERENCES supplies(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    
    -- Alert conditions and triggers
    trigger_condition JSONB, -- flexible storage for alert conditions
    threshold_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    
    -- Status and handling
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    
    -- Delivery status
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    push_sent BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase patterns analysis table
CREATE TABLE purchase_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Pattern analysis
    pattern_type VARCHAR(100) NOT NULL, -- e.g., 'seasonal', 'monthly', 'demand_based'
    pattern_description TEXT,
    
    -- Frequency analysis
    purchase_frequency_days DECIMAL(5,2),
    seasonal_variation DECIMAL(3,2), -- coefficient of variation
    
    -- Category preferences
    preferred_categories JSONB,
    category_spending_distribution JSONB,
    
    -- Timing patterns
    preferred_order_days INTEGER[], -- days of week (0-6, 0=Sunday)
    preferred_order_hours INTEGER[], -- hours of day (0-23)
    
    -- Quantity patterns
    average_order_quantity DECIMAL(10,2),
    quantity_variation DECIMAL(5,2),
    bulk_purchase_tendency DECIMAL(3,2), -- 0-1 scale
    
    -- Price sensitivity
    price_elasticity DECIMAL(5,2),
    discount_response_rate DECIMAL(3,2), -- 0-1 scale
    
    -- Prediction data
    next_predicted_purchase_date DATE,
    predicted_order_value DECIMAL(10,2),
    prediction_confidence DECIMAL(3,2), -- 0-1 scale
    
    -- Analysis metadata
    analysis_period_start DATE,
    analysis_period_end DATE,
    data_points_count INTEGER,
    last_analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory tracking table
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_id UUID REFERENCES supplies(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'transfer'
    quantity INTEGER NOT NULL, -- positive for incoming, negative for outgoing
    unit_cost DECIMAL(10,2),
    
    -- Reference to source transaction
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    reference_number VARCHAR(100),
    
    -- Location and batch information
    warehouse_location VARCHAR(100),
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    
    -- Related entities
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Delivery channels
    channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'in_app'
    
    -- Status
    sent BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    
    -- Delivery details
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    delivery_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens table (for JWT authentication)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for tracking active sessions)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table (for external integrations and ML services)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    permissions TEXT[], -- array of permissions
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML predictions table (for storing ML model outputs)
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Prediction metadata
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    prediction_type VARCHAR(100) NOT NULL, -- e.g., 'demand_forecast', 'price_prediction', 'purchase_recommendation'
    
    -- Target entity
    entity_type VARCHAR(50), -- 'supply', 'customer', 'market'
    entity_id UUID,
    
    -- Prediction data
    prediction_value JSONB NOT NULL, -- flexible storage for prediction results
    confidence_score DECIMAL(3,2), -- 0-1 scale
    feature_importance JSONB, -- which features contributed most to prediction
    
    -- Validation
    actual_value JSONB, -- for comparing predictions to reality
    accuracy_score DECIMAL(3,2), -- calculated after actual results are known
    
    -- Metadata
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_date DATE, -- what date this prediction is for
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table (for tracking all important changes)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User and action information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    resource_type VARCHAR(100) NOT NULL, -- table or entity type
    resource_id UUID,
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_supplies_supplier_id ON supplies(supplier_id);
CREATE INDEX idx_supplies_category ON supplies(category);
CREATE INDEX idx_supplies_active ON supplies(active);
CREATE INDEX idx_supplies_name ON supplies(name);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_total_spent ON customers(total_spent);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_supply_id ON order_items(supply_id);

CREATE INDEX idx_market_trends_commodity_name ON market_trends(commodity_name);
CREATE INDEX idx_market_trends_recorded_at ON market_trends(recorded_at);
CREATE INDEX idx_market_trends_category ON market_trends(category);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

CREATE INDEX idx_purchase_patterns_customer_id ON purchase_patterns(customer_id);
CREATE INDEX idx_purchase_patterns_pattern_type ON purchase_patterns(pattern_type);

CREATE INDEX idx_inventory_transactions_supply_id ON inventory_transactions(supply_id);
CREATE INDEX idx_inventory_transactions_transaction_date ON inventory_transactions(transaction_date);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX idx_ml_predictions_model_name ON ml_predictions(model_name);
CREATE INDEX idx_ml_predictions_entity_type ON ml_predictions(entity_type);
CREATE INDEX idx_ml_predictions_prediction_date ON ml_predictions(prediction_date);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to automatically update 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update 'updated_at' column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplies_updated_at BEFORE UPDATE ON supplies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_patterns_updated_at BEFORE UPDATE ON purchase_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
