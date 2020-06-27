import { Message } from "node-nats-streaming";
import mongoose from "mongoose";
import { OrderCancelledEvent, OrderStatus } from "@pjtickets/common";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Order } from '../../../models/order';

const setup = async () => {
  // create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    userId: "asdfdsdf",
    price: 10,
    status: OrderStatus.Created
  });
  await order.save();

  // create a fake data event
  const data: OrderCancelledEvent["data"] = {
    id: order.id,
    version: 1,
    ticket: {
      id: "alskdjf",
    },
  };

  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, order, msg };
};

it("update the status of the order", async () => {
  const { listener, data, order, msg } = await setup();
  
  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder).toBeDefined();
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);
  
  expect(msg.ack).toHaveBeenCalled();
});
