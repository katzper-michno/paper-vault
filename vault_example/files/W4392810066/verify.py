import numpy as np

def phi(orders, A, B):
    t = np.array([], dtype=int)
    for order in orders:
        t = np.append(t, [1 if order.index(A) <= order.index(B) else 0])
    return (t == 0).sum() <= 1;

def is_subset(A, B):
    return (A | B) == B

def verify(orders):
    for A in range(1<<6):
        for B in range(1<<6):
            if (phi(orders, A, B) != is_subset(A, B)):
                raise Exception("""Provided set of orders is 
                  not a Boolean realizer of B_6.""")

orders = []
for i in range(5):
  orders.append(list(map(int, input().split())))

verify(orders)

