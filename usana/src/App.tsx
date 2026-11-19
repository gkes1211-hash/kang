import { Routes, Route, Navigate } from 'react-router-dom';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import CustomerForm from './pages/CustomerForm';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import PurchaseForm from './pages/PurchaseForm';
import ProductMatch from './pages/ProductMatch';
import MessagePage from './pages/MessagePage';
import Templates from './pages/Templates';
import TemplateForm from './pages/TemplateForm';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />
          <Route path="/customers/:id/purchase" element={<PurchaseForm />} />
          <Route path="/customers/:id/match" element={<ProductMatch />} />
          <Route path="/customers/:id/message" element={<MessagePage />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/new" element={<TemplateForm />} />
          <Route path="/templates/:id" element={<TemplateForm />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
