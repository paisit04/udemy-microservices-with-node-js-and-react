import { Message } from "node-nats-streaming";
import mongoose from "mongoose";
import { OrderCreatedEvent, OrderStatus } from "@pjtickets/common";
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Order } from '../../../models/order';

const setup = async () => {
  // create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // create a fake data event
  const data: OrderCreatedEvent["data"] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    expiresAt: "alskdjf",
    status: OrderStatus.Created,
    userId: "alskdjf",
    ticket: {
      id: "alskdjf",
      price: 10,
    },
  };

  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it("replicates the order info", async () => {
  const { listener, data, msg } = await setup();
  
  await listener.onMessage(data, msg);

  const order = await Order.findById(data.id);

  expect(order).toBeDefined();
  expect(order!.price).toEqual(data.ticket.price);
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);
  
  expect(msg.ack).toHaveBeenCalled();
});
