import { exit } from 'process';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      debugger;
      const updateCart = [...cart];
      const productExist = updateCart.find(product => product.id === productId);
      const stock  = await api.get(`/stock/${productId}`);
      const currentAmount = productExist ? productExist.amount + 1 : 1;

      if (currentAmount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return; 
      }

      if (productExist) {
        productExist.amount = currentAmount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }

        updateCart.push(newProduct);
      }

      setCart(updateCart);
      window.localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let newCart = cart.filter(product => product.id !== productId);

      if (newCart.length === cart.length) {
        throw true;
      }

      window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return;
      }

      const { data } = await api.get(`/stock/${productId}`);
      
      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 
       
      const updateCart = [...cart];
      const productExists = updateCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(updateCart);
        
        window.localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
